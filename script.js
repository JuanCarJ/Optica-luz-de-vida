const form = document.querySelector('#booking-form');
const result = document.querySelector('.form-result');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  result.textContent = `¡Gracias, ${data.get('name')}! En desarrollo aquí se consultaría disponibilidad en ${data.get('location')} y se confirmaría por WhatsApp.`;
  form.reset();
});

document.querySelectorAll('.pill').forEach((pill) => pill.addEventListener('click', () => {
  document.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
  pill.classList.add('active');
  const filter = pill.dataset.filter;
  document.querySelectorAll('.frame-card').forEach((card) => {
    card.style.display = filter === 'all' || card.dataset.type === filter ? '' : 'none';
  });
}));

const chatbot = document.querySelector('#chatbot');
document.querySelector('#chatbot-trigger').addEventListener('click', () => chatbot.classList.toggle('open'));
document.querySelector('#chat-close').addEventListener('click', () => chatbot.classList.remove('open'));
const chatBody = document.querySelector('.chat-body');
const chatInput = document.querySelector('#chat-input');
function addBubble(text, who = 'user') {
  const bubble = document.createElement('div');
  bubble.className = `bubble ${who}`;
  bubble.textContent = text;
  bubble.style.marginTop = '10px';
  bubble.style.background = who === 'user' ? '#d9f0eb' : '#edf5f2';
  bubble.style.borderRadius = who === 'user' ? '13px 13px 3px 13px' : '13px 13px 13px 3px';
  chatBody.appendChild(bubble);
  chatBody.scrollTop = chatBody.scrollHeight;
}
function reply(text) {
  addBubble(text, 'user');
  setTimeout(() => addBubble('Puedo orientarte con sedes, servicios y una solicitud de cita. Para confirmar horarios o disponibilidad te conectaré con el equipo por WhatsApp.'), 350);
}
document.querySelectorAll('[data-reply]').forEach((button) => button.addEventListener('click', () => reply(button.dataset.reply)));
document.querySelector('#chat-send').addEventListener('click', () => { if (chatInput.value.trim()) { reply(chatInput.value.trim()); chatInput.value = ''; } });
chatInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') document.querySelector('#chat-send').click(); });
const progress = document.createElement('div'); progress.className='scroll-progress'; document.body.prepend(progress);
const revealTargets = document.querySelectorAll('.section-heading,.service-card,.frame-card,.story-image,.story-copy,.location-card,.team-card,.booking'); revealTargets.forEach(el=>el.classList.add('reveal'));
const io = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target)}}),{threshold:.12}); revealTargets.forEach(el=>io.observe(el));
window.addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-window.innerHeight; progress.style.width=`${max>0?(window.scrollY/max)*100:0}%`},{passive:true});
