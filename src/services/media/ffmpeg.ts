import { execa } from 'execa';

export interface VideoProbe {
  durationSeconds: number;
  width?: number;
  height?: number;
  fps?: number;
}

export async function probeVideo(path: string): Promise<VideoProbe> {
  const { stdout } = await execa('ffprobe', [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_streams',
    '-show_format',
    path
  ]);

  const json = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: Array<{ codec_type?: string; width?: number; height?: number; avg_frame_rate?: string }>;
  };

  const video = (json.streams ?? []).find((s) => s.codec_type === 'video');
  const durationSeconds = Number(json.format?.duration ?? 0);

  let fps: number | undefined;
  if (video?.avg_frame_rate && video.avg_frame_rate.includes('/')) {
    const [a, b] = video.avg_frame_rate.split('/').map(Number);
    if (a && b) fps = a / b;
  }

  return {
    durationSeconds,
    width: video?.width,
    height: video?.height,
    fps
  };
}

export async function exportChunkFrames(inputPath: string, outDir: string, startSecond: number, endSecond: number, fps = 2) {
  const duration = Math.max(endSecond - startSecond, 1);

  await execa('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-ss',
    String(startSecond),
    '-t',
    String(duration),
    '-i',
    inputPath,
    '-vf',
    `fps=${fps}`,
    `${outDir}/frame_%06d.jpg`
  ]);
}
