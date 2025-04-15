const handleSubmit = async (e) => {
  e.preventDefault();

  if (!isFormComplete) return;

  const { error } = await supabase
    .from("bookings")
    .insert([{ ...form, service_type: service }]);

  if (error) {
    alert("Fel vid bokning: " + error.message);
  } else {
    console.log("Sending email with the following data:", {
      name: form.name,
      email: form.email,
      phone: form.phone,
      area: form.area,
      message: form.message,
      date: form.date,
      time: form.time,
      service_type: service,
    });

    emailjs
      .send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          name: form.name,
          email: form.email,
          phone: form.phone,
          area: form.area,
          message: form.message,
          date: form.date,
          time: form.time,
          service_type: service,
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      )
      .then((result) => {
        console.log("Email sent successfully:", result.text);
      })
      .catch((error) => {
        console.error("Error sending email:", error.text);
      });

    setForm({
      name: "",
      email: "",
      phone: "",
      area: "",
      message: "",
      date: "",
      time: "",
    });

    window.location.href = "/bokning/bekräftelse";
  }
};