// dispositivo.js - usa apenas dados do JSON externo
document.addEventListener('DOMContentLoaded', () => {
  console.log('[dispositivo.js] START');

  // -------------- CONFIG ----------------
  const FILE_ID = '1ahiuDOxNHX8w2Z1josSThcbPuThvHW9C';
  // Coloque aqui sua chave de API (ou troque pela constante abaixo)
  const API_KEY = 'AIzaSyCh2dRhYZZ-knS8w7kTcmoxY4TqR-g2_XU'; // <- sua chave (ou use 'SUA_CHAVE_DE_API')
  const EXTERNAL_JSON_URL = `https://www.googleapis.com/drive/v3/files/${FILE_ID}?alt=media&key=${API_KEY}`;
  // ---------------------------------------

  // ===== Helpers =====
  function excelDateToJSDate(value) {
    const num = Number(value);
    if (!Number.isNaN(num) && num > 59) {
      const jsTime = (num - 25569) * 86400 * 1000;
      const d = new Date(jsTime);
      return d.toLocaleDateString();
    }
    const d2 = new Date(value);
    if (!Number.isNaN(d2.getTime())) return d2.toLocaleDateString();
    return String(value ?? '');
  }

  function formatCurrencyBr(value) {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value ?? '');
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    console.log('[setText] id=', id, 'exists=', !!el, 'value=', text);
    if (el) el.textContent = text ?? '';
  }

function setImage(id, src, alt = '') {
  const img = document.getElementById(id);
  if (!img) return;
  if (src) {
    // substitui espaços por %20
    img.src = src.replace(/ /g, '%20');
    img.alt = alt;
    img.style.display = '';
  } else {
    img.style.display = 'none';
  }
}

  function showError(message) {
    console.log('[showError]', message);
    let err = document.getElementById('mensagem-erro');
    if (!err) {
      err = document.createElement('div');
      err.id = 'mensagem-erro';
      err.style.textAlign = 'center';
      err.style.color = 'crimson';
      err.style.fontWeight = '600';
      err.style.marginTop = '12px';
      document.querySelector('.container')?.appendChild(err);
    }
    err.textContent = message;
  }

  function showDeviceList(list) {
    console.log('[showDeviceList] count=', list.length);
    const container = document.getElementById('lista') || document.createElement('div');
    container.id = 'lista';
    container.innerHTML = '';
    list.forEach(rec => {
      const card = document.createElement('div');
      card.style.border = '1px solid #eee';
      card.style.padding = '10px';
      card.style.margin = '8px 0';
      card.style.borderRadius = '6px';
      card.style.background = '#fafafa';

      const title = document.createElement('h3');
      title.textContent = `${rec.Detalhamento || rec.Item || rec.id || 'Sem nome'} (${rec.Item || rec.ID || ''})`;

      const pCat = document.createElement('p');
      pCat.innerHTML = `<strong>Categoria:</strong> ${rec.Categoria || ''}`;

      const pResp = document.createElement('p');
      pResp.innerHTML = `<strong>Responsável:</strong> ${rec["Responsável pelo Desenvolvimento"] || rec.Responsavel || ''}`;

      const pEconomia = document.createElement('p');
      if (rec.Economia) pEconomia.innerHTML = `<strong>Economia:</strong> R$ ${formatCurrencyBr(rec.Economia)}`;

      const img = document.createElement('img');
      img.src = rec.Imagem ? encodeURI(rec.Imagem) : '';
      img.alt = rec.Detalhamento || rec.Item || '';
      img.style.maxWidth = '120px';
      img.style.display = rec.Imagem ? '' : 'none';
      img.style.marginTop = '8px';
      img.style.borderRadius = '6px';

      const openLink = document.createElement('a');
      openLink.href = `${location.pathname}?item=${encodeURIComponent(rec.Item || rec.ID || rec.id || '')}`;
      openLink.textContent = 'Abrir';
      openLink.style.display = 'inline-block';
      openLink.style.marginTop = '8px';

      card.appendChild(title);
      card.appendChild(pCat);
      card.appendChild(pResp);
      if (rec.Economia) card.appendChild(pEconomia);
      card.appendChild(img);
      card.appendChild(openLink);
      container.appendChild(card);
    });

    if (!document.getElementById('lista')) {
      document.querySelector('.container')?.appendChild(container);
    }
  }

  function mapRecordToDevice(rec) {
    const id = String(rec.Item ?? rec.ID ?? rec.id ?? '').trim();
    const nome = rec.Detalhamento ?? rec.nome ?? `Dispositivo ${id}`;
    const molde = rec.Item ?? rec.Molde ?? '';
    const finalidade = rec.Obs ?? rec.Finalidade ?? rec.Categoria ?? '';
    const imagem = rec.Imagem ?? rec.imagem ?? '';
    const resp = rec["Responsável pelo Desenvolvimento"] ?? rec.Responsavel ?? rec.responsavel ?? '';
    let dev1 = '', dev2 = '';
    if (resp) {
      const parts = resp.split(/;|,/).map(s => s.trim()).filter(Boolean);
      dev1 = parts[0] ?? '';
      dev2 = parts[1] ?? '';
    }
    return { id, nome, imagem, molde, finalidade, dev1, dev2, economia: rec.Economia ?? rec["Economia"] ?? '', data: rec.Data ?? '', _raw: rec };
  }

  async function fetchWithTimeout(url, opts = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  async function loadData() {
    try {
      console.log('[loadData] fetching', EXTERNAL_JSON_URL);
      const res = await fetchWithTimeout(EXTERNAL_JSON_URL, { cache: 'no-cache' }, 20000);
      if (!res.ok) throw new Error('fetch falhou: ' + res.status + ' ' + res.statusText);

      const ct = (res.headers.get('content-type') || '').toLowerCase();
      console.log('[loadData] content-type=', ct);

      let dados;
      if (ct.includes('application/json') || ct.includes('text/json')) {
        dados = await res.json();
      } else {
        // tenta parsear como texto que contenha JSON
        const txt = await res.text();
        try {
          dados = JSON.parse(txt);
        } catch (err) {
          // fallback: se for um objeto que contém "values" (caso exportado do Sheets), tentamos extrair
          throw new Error('Resposta não é JSON válido (content-type=' + ct + ')');
        }
      }

      // Caso o arquivo seja um objeto com campos (ex.: { "data": [...] }) -> tenta extrair array mais óbvio
      if (!Array.isArray(dados)) {
        // exemplos de formatos comuns
        if (Array.isArray(dados.data)) dados = dados.data;
        else if (Array.isArray(dados.values)) {
          // transforma values (matriz) em array de objetos usando header row
          const [header, ...rows] = dados.values;
          dados = rows.map(r => {
            const obj = {};
            header.forEach((h, i) => obj[h] = r[i]);
            return obj;
          });
        } else {
          throw new Error('JSON não é um array e não é um formato conhecido.');
        }
      }

      console.log('[loadData] sucesso, length=', dados.length);
      return dados;
    } catch (err) {
      console.error('[loadData] falhou', err);
      showError('Falha ao carregar dados do servidor. ' + (err.message || ''));
      return [];
    }
  }

  // ==== MAIN ====
  (async () => {
    const rawData = await loadData();
    if (rawData.length === 0) return;

    const dispositivos = rawData.map(r => mapRecordToDevice(r));
    console.log('[MAIN] dispositivos mapeados =', dispositivos);

    const params = new URLSearchParams(window.location.search);
    const rawItemParam = params.get('item');
    console.log('[MAIN] rawItemParam =', rawItemParam);

    if (!rawItemParam) {
      console.log('[MAIN] sem ?item= - mostrando lista');
      showDeviceList(dispositivos);
      return;
    }

    const itemParam = String(rawItemParam).trim();
    const itemParamNoZeros = itemParam.replace(/^0+/, '') || itemParam;

    const dispositivo = dispositivos.find(d => {
      const key = String(d.id ?? '').trim();
      const keyNoZeros = key.replace(/^0+/, '') || key;
      return key === itemParam || keyNoZeros === itemParamNoZeros || key === itemParamNoZeros || keyNoZeros === itemParam;
    });

    console.log('[MAIN] dispositivo encontrado?', !!dispositivo, dispositivo);

    if (!dispositivo) {
      showError('Dispositivo não encontrado.');
      showDeviceList(dispositivos);
      return;
    }

    // preenche campos
    setText('nome', dispositivo.nome);
    setImage('imagem', dispositivo.imagem, dispositivo.nome);
    setText('molde', dispositivo.molde);
    setText('finalidade', dispositivo.finalidade);
    setText('dev1', dispositivo.dev1);
    setText('dev2', dispositivo.dev2);
    if (dispositivo.economia) setText('economia', formatCurrencyBr(dispositivo.economia));
    if (dispositivo.data) setText('data', excelDateToJSDate(dispositivo.data));

    console.log('[dispositivo.js] DONE');
  })();

});
