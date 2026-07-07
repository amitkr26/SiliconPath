import fs from 'fs';
async function fetchTi() {
  const url = "https://amd.wd1.myworkdayjobs.com/External";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  fs.writeFileSync('ti_workday.html', html);
  console.log("Saved to ti_workday.html");
}
fetchTi();
