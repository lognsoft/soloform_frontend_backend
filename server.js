const express    = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs         = require('fs');
const path       = require('path');
const session    = require('express-session');

const app = express();
const dataPath = path.join(__dirname, 'data', 'mercado.json');

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// 1) Habilita CORS
app.use(cors());

// configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'troqueEstaChave',
  resave: false,
  saveUninitialized: false
}));

// middleware que exige login
function checkAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/admin/login');
}

// Configuração SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'solopropaganda1@gmail.com',
    pass: 'kumenevadohwdmwv'
  }
});
transporter.verify(err => {
  if (err) console.error('✖ SMTP falhou:', err);
  else     console.log('✔ SMTP autenticado com sucesso!');
});

// Perguntas e alternativas (globais)
const perguntas = [
  '1. Seu lançamento já tem um posicionamento estratégico bem definido?',
  '2. Você já tem um conceito criativo ou campanha pensada para o produto?',
  '3. Seu plano de mídia já está estruturado?',
  '4. Você já sabe como vai gerar demanda qualificada para seu produto?',
  '5. Sua campanha está estruturada para trabalhar as etapas do funil de vendas?',
  '6. Sua equipe comercial está preparada com os materiais certos?',
  '7. Já pensaram em como engajar corretores e imobiliárias desde o início?',
  '8. Vocês possuem uma estratégia para gerar percepção de valor (não só preço)?',
  '9. Como está a sua preparação para criar desejo e visibilidade antes de abrir vendas?',
  '10. Qual a sua maior preocupação para o lançamento?'
];
const alternativasPorPergunta = [
  ['Sim, com diferenciais claros e um território de marca sólido','Não sei o que seria um posicionamento estratégico','Ainda não pensamos nisso','Estamos em processo de construção do posicionamento','Temos uma ideia, mas não formalizamos ainda'],
  ['Sim, com identidade visual e narrativa de marca alinhadas','Temos uma proposta visual, mas sem estratégia por trás','Estamos iniciando o desenvolvimento','Ainda não tratamos disso','Outra opção'],
  ['Sim, com canais e cronograma definidos para todas as fases','Temos uma ideia dos canais que usaremos','Estamos em fase de orçamentos e cotações','Ainda não começamos a planejar a mídia','Pretendemos resolver isso “mais perto” do lançamento'],
  ['Sim, temos uma estratégia clara de captação de leads','Pensamos em fazer campanhas digitais','Vamos depender dos corretores ou imobiliárias','Ainda estamos avaliando possibilidades','Não sabemos exatamente como funciona isso'],
  ['Sim, com ações pensadas para cada momento da jornada','Ainda estamos construindo essa régua de comunicação','Pretendemos focar mais no impacto inicial','Não estamos pensando no funil, mas apenas em “vender”','Não sabemos como estruturar isso'],
  ['Sim, com book, apresentações, roteiros e apoio digital','Temos apenas tabela e planta','Estamos desenvolvendo o kit comercial ainda','Vamos deixar com as imobiliárias','Ainda não pensamos nessa etapa'],
  ['Sim, com campanhas de incentivo, eventos e comissões agressivas','Vamos fazer um meeting ou evento de lançamento','Vamos contar com o relacionamento de praxe','Ainda não pensamos em ações específicas','Não sei se isso é relevante nessa fase'],
  ['Sim, vamos destacar atributos como localização, conceito, diferenciais construtivos','Pretendemos trabalhar os benefícios, mas o preço será o foco','Ainda estamos formatando essa proposta de valor','Não pensamos nisso como prioridade','Acreditamos que o preço por si só venderá'],
  ['Já estruturamos a campanha de pré-marketing e teasers','Vamos trabalhar redes sociais e lista de espera','Estamos pensando em mídia só para o lançamento','Ainda não definimos essa etapa','Não achamos necessário divulgar antes de lançar'],
  ['Gerar leads qualificados e com potencial real de compra','Comunicar valor e se destacar da concorrência','Ter uma régua de vendas com constância','Engajar os corretores de forma eficiente','Não saber por onde começar com a comunicação']
];

// comentado.......
// POST /submit-quiz
// app.post('/submit-quiz', (req, res) => {
//   const { nome, email, telefone, respostas } = req.body;
//   if (!nome || !email || !telefone || !Array.isArray(respostas)) {
//     return res.status(400).json({ error: 'Dados inválidos.' });
//   }

//   fs.readFile(dataPath, 'utf8', (err, content) => {
//     if (err) return res.status(500).json({ error: 'Erro ao ler dados.' });
//     let data;
//     try { data = JSON.parse(content); }
//     catch { return res.status(500).json({ error: 'JSON corrompido.' }); }

//     const nextId = data.respostasMercado.reduce((m, x) => Math.max(m, x.id), 0) + 1;
//     data.respostasMercado.push({
//       id: nextId,
//       nome,
//       email,
//       telefone,
//       respostas,
//       createdAt: new Date().toISOString(),
//       checked: false
//     });

//     fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8', writeErr => {
//       if (writeErr) return res.status(500).json({ error: 'Falha ao gravar.' });

//       const link = `${req.protocol}://${req.get('host')}/result/${nextId}`;

//       // 1) E-mail para o Bruno (com perguntas e respostas completas como texto)
//       transporter.sendMail({
//         from: 'solopropaganda1@gmail.com',
//         to: 'solopropaganda1@gmail.com',
//         cc: [
//           'roger@solopropaganda.com.br',
//           'mario@solopropaganda.com.br',
//           'vinicius.vicente@solopropaganda.com.br'
//         ],
//         subject: `Novo envio de questionário (#${nextId})`,
//         html: `
//           <h2>Novo envio de questionário imobiliário (#${nextId})</h2>
//           <p><strong>Nome:</strong> ${nome}</p>
//           <p><strong>E-mail:</strong> ${email}</p>
//           <p><strong>Telefone:</strong> ${telefone}</p>
//           <p>
//             <strong>Link para visualizar gráfico e detalhes:</strong><br/>
//             <a href="${link}">${link}</a>
//           </p>
//         `
//       }, errBruno => {
//         if (errBruno) {
//           console.error('Erro enviando e-mail para Bruno:', errBruno);
//           return res.status(500).json({ error: 'Falha ao enviar e-mail interno.' });
//         }

//         // 2) E-mail de agradecimento ao cliente (sem alterações aqui)
// //         transporter.sendMail({
// //           from: 'webmaster@solopropaganda.com.br',
// //           to: email,
// //           subject: 'Obrigado pelo seu envio!',
// //            html: `
// //           <!DOCTYPE html>
// // <html lang="pt-BR">
// // <head>
// //   <meta charset="UTF-8"/>
// //   <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
// //   <title>Confirmação de Recebimento</title>
// // </head>
// // <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
// //   <table
// //     align="center"
// //     width="100%"
// //     cellpadding="0"
// //     cellspacing="0"
// //     style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; font-family: Arial, sans-serif;"
// //   >
// //     <!-- Header -->
// //     <tr>
// //       <td style="background-color: #ff820d; padding: 20px; text-align: center;">
// //         <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Obrigado pelo contato!</h1>
// //       </td>
// //     </tr>

// //     <!-- Body -->
// //     <tr>
// //       <td style="padding: 30px 20px; color: #333333;">
// //         <h2 style="margin-top: 0; font-size: 20px;">Olá ${nome},</h2>
// //         <p style="font-size: 16px; line-height: 1.5;">
// //           Seu email foi recebido com sucesso. Nossa equipe já está analisando sua mensagem
// //           e em breve retornaremos com mais informações.
// //         </p>

// //         <!-- Call-to-Action -->
// //         <p style="text-align: center; margin: 30px 0;">
// //           <a
// //             href="https://www.solopropaganda.com.br"
// //             style="display: inline-block; background-color: #ff820d; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-size: 16px;"
// //           >
// //             Acesse nosso site
// //           </a>
// //         </p>

// //         <p style="font-size: 14px; color: #777777;">
// //           Somos especialistas em saúde e bem-estar, combinando criatividade e dados para acelerar o crescimento de marcas e negócios.
// //         </p>
// //       </td>
// //     </tr>

// //     <!-- Footer -->
// //     <tr>
// //       <td style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 14px; color: #777777;">
// //         <p style="margin: 0; font-weight: bold; color: #333333;">SOLO PROPAGANDA</p>
// //         <p style="margin: 4px 0;">Wellness Ads Agency</p>
// //         <p style="margin: 4px 0;">
// //           Av. Cel. Silva Telles, 1002 | Conj 52, Campinas – SP
// //         </p>
// //         <p style="margin: 4px 0;">
// //           Tel: +55 (19) 3255 1929 |
// //           E-mail:
// //           <a href="mailto:hello@solopropaganda.com.br" style="color: #0071BC; text-decoration: none;">
// //             hello@solopropaganda.com.br
// //           </a>
// //         </p>
// //         <p style="margin: 12px 0 0 0; font-size: 12px; color: #999999;">
// //           ©2025 SOLO. Wellness Ads Agency. Todos os direitos reservados.
// //         </p>
// //       </td>
// //     </tr>
// //   </table>
// // </body>
// // </html>
// //           `
// //         }, errCliente => {
// //           if (errCliente) {
// //             console.error('Erro enviando e-mail ao cliente:', errCliente);
// //             return res.status(500).json({ error: 'Falha ao enviar confirmação ao cliente.' });
// //           }
// //           res.json({ success: true, link });
// //         });
//       });
//     });
//   });
// });


app.post('/submit-quiz', (req, res) => {
  const { nome, email, telefone, respostas } = req.body;
  if (!nome || !email || !telefone || !Array.isArray(respostas)) {
    return res.status(400).json({ error: 'Dados inválidos.' });
  }

  fs.readFile(dataPath, 'utf8', (err, content) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler dados.' });
    let data;
    try { data = JSON.parse(content); }
    catch { return res.status(500).json({ error: 'JSON corrompido.' }); }

    const nextId = data.respostasMercado.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    data.respostasMercado.push({
      id:        nextId,
      nome,
      email,
      telefone,
      respostas,
      createdAt: new Date().toISOString(),
      checked:   false
    });

    console.log(data.respostasMercado);

    fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8', writeErr => {
      if (writeErr) return res.status(500).json({ error: 'Falha ao gravar.' });

      const link = `${req.protocol}://${req.get('host')}/result/${nextId}`;

      // E-mail interno para Bruno
      transporter.sendMail({
        from:    'solopropaganda1@gmail.com',
        to:      'solopropaganda1@gmail.com',
        cc:      [
          'rogerio@solopropaganda.com.br',
          'mario@solopropaganda.com.br',
          'vinicius.vicente@solopropaganda.com.br'
        ],
        subject: `Novo envio de questionário (#${nextId})`,
        html: `
          <h2>Novo envio de questionário imobiliário (#${nextId})</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>E-mail:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${telefone}</p>
          <hr>
          <p><strong>Relatório:</strong> <a href="${link}">${link}</a></p>
        `
      }, errBruno => {
        if (errBruno) {
          console.error('Erro e-mail interno:', errBruno);
          return res.status(500).json({ error: 'Falha ao enviar e-mail interno.' });
        }
        res.json({ success: true, link });
      });
    });
  });
});


// GET /result/:id
// Dentro de server.js

// GET /result/:id
app.get('/result/:id', checkAuth, (req, res) => {
  const id      = Number(req.params.id);
  const content = fs.readFileSync(dataPath, 'utf8');
  const data    = JSON.parse(content);
  const respostasMercado = data.respostasMercado;
  const item    = respostasMercado.find(u => u.id === id);
  if (!item) return res.status(404).send('Resultado não encontrado.');

  // calcula média de mercado (caso ainda queira usar)
  const todas = respostasMercado.map(u => u.respostas);
  const count = todas.length;
  const media = count
    ? todas[0].map((_, i) =>
        todas.reduce((s, a) =>
          s + (typeof a[i] === 'number' ? a[i] : 0)
        , 0) / count
      )
    : Array(item.respostas.length).fill(0);

  // converte respostas do usuário para texto
  const respostasTexto = item.respostas.map((v, i) => {
    if (typeof v === 'number') {
      return alternativasPorPergunta[i][v - 1] || '—';
    } else if (typeof v === 'string') {
      return v;
    }
    return '—';
  });

  const isChecked = item.checked === true;

  // envia a página completa
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Resultado do gráfico</title>

  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- jsPDF -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <!-- Quill -->
  <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
  <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>

  <style>
    body, html {
      margin: 0;
      padding: 0;
      height: 100%;
      font-family: sans-serif;
      position: relative;
    }
    /* botão voltar fixo */
    .back-btn {
      position: absolute;
      top: 0.5rem;
      left: 1rem;
      background: #6c757d;
      color: #fff;
      border: none;
      padding: .5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      z-index: 10;
    }
    /* desloca todo o conteúdo abaixo do botão */
    .container {
      position: absolute;
      top: 3rem;    /* altura do botão + espaçamento */
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
    }
    .attended { position: absolute; top: .5rem; right: 1rem; font-size: 1rem; }
    .left {
      width: 30%; min-width: 280px;
      padding: 1rem; overflow-y: auto;
      background: #f7f7f7; font-size: .9rem;
      position: relative;
    }
    .right {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 1rem; background: #fff;
    }
    #chart-wrapper { width: 600px; height: 600px; }
    #myChart { width: 100%; height: 100%; }
    .buttons { margin-top: 1rem; }
    .buttons button {
      margin-right: .5rem;
      padding: .5rem 1rem;
      font-size: 1rem;
      cursor: pointer;
    }
    /* Modal */
    #replyModal {
      display: none;
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.5);
      align-items: center; justify-content: center;
    }
    #replyModal .modal-content {
      background: #fff; padding: 1rem; border-radius: 4px;
      width: 90%; max-width: 500px;
    }
    #editor { height: 200px; background: #fff; }
    .modal-content .actions {
      text-align: right; margin-top: 1rem;
    }
    .modal-content .actions button {
      margin-left: .5rem;
    }
    #replySpinner {
      display: none; text-align: center; margin-top: 1rem;
    }
  </style>
</head>
<body>

  <!-- Botão Voltar -->
  <button class="back-btn" onclick="window.history.back()">← Voltar</button>

  <!-- Checkbox "Cliente atendido" -->
  <div class="attended">
    <label>
      <input type="checkbox" id="attendedCheckbox" ${isChecked ? 'checked' : ''}/>
      Cliente atendido
    </label>
  </div>

  <div class="container">
    <div class="left">
      <h3>Seus Dados</h3>
      <p>
        <strong>Nome:</strong> ${item.nome}<br/>
        <strong>E-mail:</strong> ${item.email}<br/>
        <strong>Telefone:</strong> ${item.telefone}
      </p>

      <h3>Suas Respostas</h3>
      <ol style="padding-left:15px">
        ${
          perguntas.map((p, i) => `
            <li style="padding-bottom:10px; list-style:none">
              <strong>${p.replace(/^\d+\.\\s*/, '')}</strong><br/>
              ${respostasTexto[i]}
              <hr>
            </li>
          `).join('')
        }
      </ol>
    </div>

    <div class="right">
      <div id="chart-wrapper"><canvas id="myChart"></canvas></div>
      <div class="buttons">
        <button id="downloadJpg">Baixar JPG</button>
        <button id="downloadPdf">Baixar PDF</button>
        <button id="btnReply">Enviar Resposta</button>
      </div>
    </div>
  </div>

  <div id="replyModal">
    <div class="modal-content">
      <p>
        <strong>De:</strong> solopropaganda1@gmail.com<br/>
        <strong>Para:</strong> ${item.email}
      </p>
      <div id="editor"></div>
      <div id="replySpinner">
        <svg width="38" height="38" viewBox="0 0 38 38" stroke="#555">…</svg>
        <div>Enviando…</div>
      </div>
      <div class="actions">
        <button id="cancelReply">Cancelar</button>
        <button id="sendReply">Enviar</button>
      </div>
    </div>
  </div>

  <script>
    // dados para o gráfico e tooltips
    const respostasTextoJS    = ${JSON.stringify(respostasTexto)};
    const respostasMercadoAll = ${JSON.stringify(respostasMercado)};
    const alternativas        = ${JSON.stringify(alternativasPorPergunta)};
    const rawLabels           = ${JSON.stringify(perguntas)};
    const responses           = ${JSON.stringify(item.respostas)};
    const mediaData           = ${JSON.stringify(media.map(v => +v.toFixed(1)))};
    const ideal               = Array(rawLabels.length).fill(5);

    // plugin para fundo branco
    const bgWhite = {
      id: 'bg_white',
      beforeDraw(chart) {
        const ctx = chart.ctx;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      }
    };

    // quebra de linha nos labels
    function wrapLabel(text, maxLen) {
      const words = text.split(' '), lines = [''];
      words.forEach(w => {
        const last = lines[lines.length-1];
        if ((last + ' ' + w).trim().length > maxLen) lines.push(w);
        else lines[lines.length-1] = last ? last + ' ' + w : w;
      });
      return lines;
    }
    const labels = rawLabels.map(l => wrapLabel(l, 25));

    // inicializa o Chart.js
    const ctx = document.getElementById('myChart').getContext('2d');
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Meus Dados',
            data: responses,
            borderColor: '#E69F00',
            backgroundColor: 'rgba(230,159,0,0.2)',
            borderWidth: 3,
            fill: true
          },
          {
            label: 'Média Mercado',
            data: mediaData,
            borderColor: '#009E73',
            backgroundColor: 'rgba(0,158,115,0.2)',
            borderWidth: 3,
            borderDash: [5,5],
            fill: true
          },
          {
            label: 'Ideal (5)',
            data: ideal,
            borderColor: '#56B4E9',
            backgroundColor: 'rgba(86,180,233,0.2)',
            borderWidth: 2,
            borderDash: [7,3],
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 1, max: 5,
            ticks: { stepSize: 1 },
            pointLabels: { font: { size: 12 } }
          }
        },
        plugins: {
          bg_white: {},
          tooltip: {
            callbacks: {
              title: function(context) {
                const idx     = context[0].dataIndex;
                const dsLabel = context[0].dataset.label;

                if (dsLabel === 'Meus Dados') {
                  return respostasTextoJS[idx];

                } else if (dsLabel === 'Média Mercado') {
                  // EXIBE A ALTERNATIVA CORRESPONDENTE AO VALOR MÉDIO
                  const avg     = mediaData[idx];
                  const roundV  = Math.round(avg);
                  return alternativas[idx][roundV - 1] || '—';

                } else if (dsLabel === 'Ideal (5)') {
                  // EXIBE A ALTERNATIVA IDEAL (5ª)
                  const idealV = ideal[idx];
                  return alternativas[idx][idealV - 1] || '—';
                }

                return dsLabel + ': ' + context[0].formattedValue;
              },
              label: function(context) {
                return context.dataset.label + ': ' + context.formattedValue;
              }
            }
          }
        }
      },
      plugins: [ bgWhite ]
    });

    // download JPG
    document.getElementById('downloadJpg').onclick = () => {
      const header = 80;
      const tmp   = document.createElement('canvas');
      tmp.width  = ctx.canvas.width;
      tmp.height = ctx.canvas.height + header;
      const c2 = tmp.getContext('2d');
      c2.fillStyle = '#fff';
      c2.fillRect(0,0,tmp.width,tmp.height);
      c2.textAlign = 'right';
      c2.font = 'bold 14px sans-serif';
      c2.fillStyle = '#000';
      c2.fillText(\`Nome: ${item.nome}\`, tmp.width-20, 20);
      c2.fillText(\`E-mail: ${item.email}\`, tmp.width-20, 40);
      c2.fillText(\`Telefone: ${item.telefone}\`, tmp.width-20, 60);
      const img = new Image();
      img.onload = () => {
        c2.drawImage(img,0,header,ctx.canvas.width,ctx.canvas.height);
        const a = document.createElement('a');
        a.href = tmp.toDataURL('image/jpeg');
        a.download = 'Resultado_${item.nome}.jpg';
        a.click();
      };
      img.src = ctx.canvas.toDataURL('image/png');
    };

    // download PDF
    document.getElementById('downloadPdf').onclick = () => {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation:'landscape', unit:'px',
        format:[ctx.canvas.width, ctx.canvas.height+80]
      });
      pdf.setFontSize(12);
      pdf.text(\`Nome: ${item.nome}\`, ctx.canvas.width-20, 20, { align:'right' });
      pdf.text(\`E-mail: ${item.email}\`, ctx.canvas.width-20, 35, { align:'right' });
      pdf.text(\`Telefone: ${item.telefone}\`, ctx.canvas.width-20, 50, { align:'right' });
      pdf.addImage(ctx.canvas.toDataURL('image/png'),'PNG',0,80,ctx.canvas.width,ctx.canvas.height);
      pdf.save('Resultado_${item.nome}.pdf');
    };

    // toggle attended
    document.getElementById('attendedCheckbox').addEventListener('change', function(){
      fetch(\`/result/${id}/check\`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ checked:this.checked })
      });
    });

    // Quill modal
    const quill = new Quill('#editor',{ theme:'snow' });
    document.getElementById('btnReply').onclick    = () => document.getElementById('replyModal').style.display='flex';
    document.getElementById('cancelReply').onclick = () => document.getElementById('replyModal').style.display='none';
    document.getElementById('sendReply').onclick   = () => {
      const spinner = document.getElementById('replySpinner');
      spinner.style.display = 'block';
      const html   = quill.root.innerHTML;
      const jpg    = ctx.canvas.toDataURL('image/jpeg');
      const pdfDoc = new jsPDF({orientation:'landscape',unit:'px',format:[ctx.canvas.width,ctx.canvas.height+80]});
      pdfDoc.addImage(ctx.canvas.toDataURL('image/png'),'PNG',0,80,ctx.canvas.width,ctx.canvas.height);
      const pdf    = pdfDoc.output('datauristring');
      fetch(\`/reply/${id}\`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ reply:html, jpg, pdf })
      })
      .then(()=> {
        spinner.style.display='none';
        document.getElementById('replyModal').style.display='none';
        alert('Enviado com sucesso!');
      });
    };
  </script>
</body>
</html>
  `);
});


// POST /result/:id/check
app.post('/result/:id/check', checkAuth, (req, res) => {
  const id = Number(req.params.id);
  const { checked } = req.body;
  fs.readFile(dataPath, 'utf8', (err, content) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler dados.' });
    let data;
    try { data = JSON.parse(content); }
    catch { return res.status(500).json({ error: 'JSON inválido.' }); }
    const record = data.respostasMercado.find(u => u.id === id);
    if (!record) return res.status(404).json({ error: 'Registro não encontrado.' });
    record.checked = !!checked;
    fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8', writeErr => {
      if (writeErr) return res.status(500).json({ error: 'Falha ao gravar.' });
      res.json({ success: true });
    });
  });
});

// POST /reply/:id
app.post('/reply/:id', (req, res) => {
  const id = Number(req.params.id);
  const { reply, jpg, pdf } = req.body;
  const data = JSON.parse(fs.readFileSync(dataPath,'utf8'));
  const user = data.respostasMercado.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  let html = `<h2>Resposta ao seu Quiz</h2><p>${reply}</p><hr/><h3>Seus Dados</h3><p><strong>Nome:</strong> ${user.nome}<br/><strong>E-mail:</strong> ${user.email}<br/><strong>Telefone:</strong> ${user.telefone}</p><h3>Suas Respostas</h3><ol>`;
  user.respostas.forEach((v,i) => {
    const txt = alternativasPorPergunta[i][v-1] || '—';
    html += `<li style="list-style: none"><strong>${perguntas[i]}</strong><br/>${txt}</li><hr>`;
  });
  html += '</li>';
  const attachments = [
    { filename: 'grafico.jpg', content: Buffer.from(jpg.split('base64,')[1], 'base64') },
    { filename: 'grafico.pdf', content: Buffer.from(pdf.split('base64,')[1], 'base64') }
  ];
  transporter.sendMail({
    from: 'brunobafilli@gmail.com',
    to: user.email,
    subject: 'Resposta ao seu Quiz',
    html,
    attachments
  }, err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Falha ao enviar e-mail.' });
    }
    res.json({ success: true });
  });
});


// Rota de busca /api/search
app.get('/api/search', checkAuth, (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  fs.readFile(dataPath, 'utf8', (err, content) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler dados.' });
    let data;
    try { data = JSON.parse(content); }
    catch { return res.status(500).json({ error: 'JSON inválido.' }); }

    const results = data.respostasMercado
      .filter(u =>
        (u.nome     || '').toLowerCase().includes(q) ||
        (u.email    || '').toLowerCase().includes(q) ||
        (u.telefone || '').includes(q)
      )
      .map(u => ({
        id:        u.id,
        nome:      u.nome,
        email:     u.email,
        telefone:  u.telefone,
        createdAt: u.createdAt || '-',
        checked:   !!u.checked   // ← e aqui também
      }))
    ;

    res.json(results);
  });
});
// Rota paginada /api/users
app.get('/api/users', checkAuth, (req, res) => {
  const page     = Math.max(1, parseInt(req.query.page)    || 1);
  const pageSize = Math.max(1, parseInt(req.query.pageSize)|| 10);

  fs.readFile(dataPath, 'utf8', (err, content) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler dados.' });
    let data;
    try { data = JSON.parse(content); }
    catch { return res.status(500).json({ error: 'JSON inválido.' }); }

    const all = (data.respostasMercado || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const total      = all.length;
    const totalPages = Math.ceil(total / pageSize);
    const start      = (page - 1) * pageSize;

    const usersPage = all.slice(start, start + pageSize).map(u => ({
      id:        u.id,
      nome:      u.nome,
      email:     u.email,
      telefone:  u.telefone,
      createdAt: u.createdAt || '-',
      checked:   !!u.checked       // ← aqui incluímos o campo checked
    }));

    res.json({ page, pageSize, total, totalPages, users: usersPage });
  });
});

// formulário de login
app.get('/admin/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <title>Login Admin</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: sans-serif;
          background-color: #f0f2f5;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .login-container {
          background: #fff;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 360px;
        }
        .login-container h1 {
          font-size: 1.5rem;
          color: #333;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .login-container form {
          display: flex;
          flex-direction: column;
        }
        .login-container label {
          font-size: 1rem;
          color: #555;
          margin-bottom: 1rem;
        }
        .login-container input {
          margin-top: 0.5rem;
          padding: 0.5rem;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 100%;
        }
        .login-container button {
          margin-top: 1.5rem;
          padding: 0.75rem;
          font-size: 1rem;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .login-container button:hover {
          background-color: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <h1>Área Administrativa - Imobiliario</h1>
        <form action="/admin/login" method="POST">
          <label>
            Usuário
            <input type="text" name="username" required />
          </label>
          <label>
            Senha
            <input type="password" name="password" required />
          </label>
          <button type="submit">Entrar</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// validação de credenciais
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'admin@123';

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.user = username;
    return res.redirect('/admin');
  }

  res.send('Usuário ou senha inválidos. <a href="/admin/login">Tentar novamente</a>');
});

// logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// Rota admin
app.get('/admin', checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));