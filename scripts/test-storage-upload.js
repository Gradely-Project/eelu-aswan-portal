const url = 'https://yhmzilfqdubjygmokghz.supabase.co';
const key = 'sb_publishable_skmzLJHAGopLTz7IY20C0Q_0xlWvPhA';

async function testUpload() {
  const content = Buffer.from("Hello EELU Aswan Portal Storage!");
  const res = await fetch(`${url}/storage/v1/object/materials/test.txt`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'text/plain',
      'x-upsert': 'true'
    },
    body: content
  });
  const data = await res.json();
  console.log("Upload response:", res.status, data);

  const publicUrl = `${url}/storage/v1/object/public/materials/test.txt`;
  console.log("Public URL:", publicUrl);

  const getRes = await fetch(publicUrl);
  console.log("Fetch public URL status:", getRes.status, await getRes.text());
}

testUpload().catch(console.error);
