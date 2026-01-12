// ==== DADOS DOS DISPOSITIVOS ====
// Aqui você coloca todos os dispositivos que quiser
const dispositivos = [
  {
    "id": "1234",
    "nome": "Dispositivo Alpha",
    "imagem": "images/testeqr.png",
    "molde": "1105",
    "finalidade": "Medir radial e axial",
    "dev1": "Bruno Rocha - Engenharia",
    "dev2": "Matheus Tinti - Engenharia"
  },
  {
    "id": "5678",
    "nome": "Dispositivo Beta",
    "imagem": "images/testeqr2.png",
    "molde": "2201",
    "finalidade": "Teste funcional Beta",
    "dev1": "Outro Dev 1 - Engenharia",
    "dev2": "Outro Dev 2 - Engenharia"
  }
  // -> adicione novos dispositivos aqui seguindo o mesmo formato
];

// ==== PEGANDO O ID DA URL ====
const params = new URLSearchParams(window.location.search);
const id = params.get('id'); // pega o id da URL ?id=XXXX

// ==== BUSCANDO O DISPOSITIVO ====
const dispositivo = dispositivos.find(d => d.id === id);

// ==== PREENCHENDO OS CAMPOS ====
if (dispositivo) {
  document.getElementById('nome').innerText = dispositivo.nome;
  document.getElementById('imagem').src = dispositivo.imagem;
  document.getElementById('molde').innerText = dispositivo.molde;
  document.getElementById('finalidade').innerText = dispositivo.finalidade;
  document.getElementById('dev1').innerText = dispositivo.dev1;
  document.getElementById('dev2').innerText = dispositivo.dev2;
} else {
  // Se não encontrar, mantém a imagem inicial e mostra mensagem
  document.body.innerHTML += "<p style='text-align:center; color:red; font-weight:bold;'>Dispositivo não encontrado.</p>";
}
