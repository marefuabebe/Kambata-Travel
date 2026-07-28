fetch("https://kambata-travel.onrender.com/api/auth/resend-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "devmareab@gmail.com" })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
