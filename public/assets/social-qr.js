const qrDialog = document.getElementById('social-qr-dialog');

if (qrDialog && typeof qrDialog.showModal === 'function') {
  const title = qrDialog.querySelector('#social-qr-title');
  const hint = qrDialog.querySelector('#social-qr-hint');
  const image = qrDialog.querySelector('.social-qr-full');
  const save = qrDialog.querySelector('.social-qr-save');

  document.querySelectorAll('[data-qr-platform]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const platform = link.dataset.qrPlatform;
      title.textContent = platform + '二维码';
      hint.textContent = link.dataset.qrHint;
      image.src = link.href;
      image.alt = platform + '账号二维码';
      save.href = link.href;
      save.download = '金品汇' + platform + '二维码.png';
      qrDialog.showModal();
    });
  });

  qrDialog.querySelector('[data-qr-close]').addEventListener('click', () => qrDialog.close());
  qrDialog.addEventListener('click', event => {
    if (event.target === qrDialog) qrDialog.close();
  });
}
