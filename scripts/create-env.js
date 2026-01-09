import fs from "fs";
import path from "path";

const pairs = [
  {
    source: ".env.example",
    target: ".env",
  },
  {
    source: path.join("server", ".env.example"),
    target: path.join("server", ".env"),
  },
];

pairs.forEach(({ source, target }) => {
  const sourcePath = path.resolve(source);
  const targetPath = path.resolve(target);

  if (!fs.existsSync(sourcePath)) {
    console.warn(`Missing template: ${source}`);
    return;
  }

  if (fs.existsSync(targetPath)) {
    console.log(`Exists: ${target}`);
    return;
  }

  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Created: ${target}`);
});
