export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    const payload = body.payload || {};
    const data = payload.data || {};

    if ((data["form-name"] || data.form_name) !== "orderSilata") {
      return { statusCode: 200, body: "skip" };
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = process.env.FROM_EMAIL;                 // напр. orders@danyyordanov.com (верифициран в Resend)
    const ORDER_NOTIFY_EMAIL = process.env.ORDER_NOTIFY_EMAIL; // имейлът на собственика

    if (!RESEND_API_KEY || !FROM_EMAIL || !ORDER_NOTIFY_EMAIL) {
      console.warn("Missing email env vars");
      return { statusCode: 200, body: "missing env" };
    }

    const name = data.name || "";
    const email = data.email || "";
    const phone = data.phone || "";
    const addr = data.address || "";
    const city = data.city || "";
    const zip = data.zip || "";
    const delivery = data.delivery_method || "";
    const gift = data.gift_book_added || "no";
    const totalBGN = data.total_bgn || "";
    const totalEUR = data.total_eur || "";

    const adminHtml = `
      <h2>Нова поръчка – "Силата да бъдеш себе си"</h2>
      <p><strong>Име:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Телефон:</strong> ${phone}</p>
      <p><strong>Адрес:</strong> ${addr}, ${city} ${zip}</p>
      <p><strong>Доставка:</strong> ${delivery}</p>
      <p><strong>Втора книга (17 лв):</strong> ${gift}</p>
      <p><strong>Общо:</strong> ${totalBGN} лв / €${totalEUR}</p>
    `;

    const userHtml = `
      <h2>Благодарим за поръчката!</h2>
      <p>Получихме заявката ти за книгата <em>"Силата да бъдеш себе си"</em>.</p>
      <p><strong>Общо:</strong> ${totalBGN} лв / €${totalEUR}</p>
      <p>Ще се свържем с теб за потвърждение и изпращане по СПИДИ (наложен платеж).</p>
      <p>Ако имаш въпроси, просто отговори на този имейл.</p>
    `;

    const send = async (to, subject, html) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
      });
      if (!res.ok) throw new Error(await res.text());
    };

    await Promise.all([
      send(ORDER_NOTIFY_EMAIL, `Нова поръчка – Силата (${totalBGN} лв)`, adminHtml),
      email ? send(email, "Получихме поръчката ти – Силата да бъдеш себе си", userHtml) : null
    ]);

    return { statusCode: 200, body: "ok" };
  } catch (e) {
    console.error(e);
    return { statusCode: 200, body: "error" };
  }
}
