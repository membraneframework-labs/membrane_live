import { createWorker, createScheduler } from "tesseract.js";
import moment from "moment";

const scheduler = createScheduler();

export const doOCR = async (playerRef: React.RefObject<HTMLVideoElement>) => {
  if (scheduler.getNumWorkers() == 0) await initializeTeseract();

  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 100;

  const ctx = canvas.getContext("2d");
  const video = playerRef.current;

  ctx && video && ctx.drawImage(video, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

  const {
    data: { text },
  } = await scheduler.addJob("recognize", canvas);

  const currentTime = new Date();
  const formatString = "DD/MM/YYYY HH:mm:ss:SS";
  const detectedDate = moment(text, formatString).toDate();

  console.log((currentTime.getTime() - detectedDate.getTime()) / 1000);
};

const initializeTeseract = async () => {
  const worker = await createWorker();
  await worker.load();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");
  scheduler.addWorker(worker);
};
