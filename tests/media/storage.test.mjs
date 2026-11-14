// Run with: npm run test:media   (Node 22.18+ strips TypeScript types natively)
import { test } from "node:test";
import assert from "node:assert/strict";
import { presignUrl, signRequest, objectLocation, clipObjectKeys } from "../../src/lib/storage.ts";

// Official AWS Signature V4 examples:
// https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
// https://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-header-based-auth.html
const awsExample = {
  endpoint: "https://s3.amazonaws.com",
  region: "us-east-1",
  bucket: "examplebucket",
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  forcePathStyle: false,
};
const exampleDate = new Date("2013-05-24T00:00:00Z");

test("presigned GET matches the AWS documentation example", () => {
  const url = presignUrl(awsExample, {
    method: "GET",
    key: "test.txt",
    expiresInSeconds: 86400,
    now: exampleDate,
  });
  assert.equal(
    url,
    "https://examplebucket.s3.amazonaws.com/test.txt" +
      "?X-Amz-Algorithm=AWS4-HMAC-SHA256" +
      "&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request" +
      "&X-Amz-Date=20130524T000000Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host" +
      "&X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404",
  );
});

test("header-signed ranged GET matches the AWS documentation example", () => {
  const req = signRequest(awsExample, "GET", "test.txt", { Range: "bytes=0-9" }, exampleDate);
  assert.equal(
    req.headers.authorization,
    "AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, " +
      "SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, " +
      "Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41",
  );
  assert.equal(req.headers.host, undefined);
});

test("path-style URLs include the bucket and encode the key", () => {
  const { url, path } = objectLocation(
    { ...awsExample, endpoint: "https://acct.r2.cloudflarestorage.com/", forcePathStyle: true },
    "clips/abc/my file(1).mp4",
  );
  assert.equal(path, "/examplebucket/clips/abc/my%20file%281%29.mp4");
  assert.equal(url.host, "acct.r2.cloudflarestorage.com");
});

test("presigned PUT signs the content-type header", () => {
  const url = presignUrl(
    { ...awsExample, forcePathStyle: true },
    { method: "PUT", key: "clips/x/video.mp4", contentType: "video/mp4", expiresInSeconds: 900, now: exampleDate },
  );
  assert.match(url, /X-Amz-SignedHeaders=content-type%3Bhost/);
  assert.match(url, /^https:\/\/s3\.amazonaws\.com\/examplebucket\/clips\/x\/video\.mp4\?/);
});

test("object keys never contain user input", () => {
  assert.deepEqual(clipObjectKeys("65f0c0ffee", "video/quicktime", "image/webp"), {
    videoKey: "clips/65f0c0ffee/video.mov",
    thumbnailKey: "clips/65f0c0ffee/thumbnail.webp",
  });
});
