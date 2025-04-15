// email.js
(function () {
  emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);

  const form = document.getElementById("email-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    emailjs.sendForm(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATE_ID,
      form
    )
    .then(() => {
      alert("📨 Email sent using config.js!");
      form.reset();
    })
    .catch((error) => {
      console.error("Email error with config.js:", error);
      alert("❌ Failed to send email.");
    });
  });
})();
