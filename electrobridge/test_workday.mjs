async function test() {
  const url = "https://ti.wd1.myworkdayjobs.com/wday/cxs/ti/External/jobs";
  const body = {};
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    },
    body: JSON.stringify(body)
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text.substring(0, 500));
}
test();
