const menu = document.querySelector('.menu-toggle');
const navigation = document.getElementById('site-navigation');

function setMenu(open) {
  navigation.classList.toggle('is-open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
}

menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
navigation.addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menu.focus();
  }
});

const phaseTabs = [...document.querySelectorAll('.phase-switch [role="tab"]')];
function selectPhase(selected) {
  for (const tab of phaseTabs) {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
  }
}
phaseTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectPhase(tab));
  tab.addEventListener('keydown', event => {
    const offsets = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: phaseTabs.length - 1 };
    if (!Object.hasOwn(offsets, event.key)) return;
    event.preventDefault();
    const target = phaseTabs[(offsets[event.key] + phaseTabs.length) % phaseTabs.length];
    selectPhase(target);
    target.focus();
  });
});

const serviceNav = [...document.querySelectorAll('.subnav a')];
serviceNav.forEach(link => link.addEventListener('click', () => {
  serviceNav.forEach(other => other.removeAttribute('aria-current'));
  link.setAttribute('aria-current', 'location');
}));

document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = '已复制地址';
      setTimeout(() => { button.textContent = '复制地址'; }, 2000);
    } catch {
      button.textContent = '请手动复制地址';
    }
  });
});

