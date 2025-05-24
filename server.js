



import { S3 } from 'aws-sdk';

const spacesEndpoint = process.env.DO_SPACES_ENDPOINT;
const s3 = new S3({
  endpoint: `https://${spacesEndpoint}`,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: 'us-east-1', // DigitalOcean Spaces uses this region
  signatureVersion: 'v4'
});

export const POST = async ({ request }) => {
  const data = await request.formData();
  const file = data.get('file'); // expects a <input type="file" name="file" />

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const params = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: `videos/${file.name}`,
    Body: buffer,
    ACL: 'public-read',
    ContentType: file.type
  };

  try {
    const upload = await s3.upload(params).promise();
    return new Response(JSON.stringify({ url: upload.Location }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};



