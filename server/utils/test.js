const msToHumanReadable = (durationInMs) => {
  const milliseconds = durationInMs % 1000;
  const seconds = Math.floor(durationInMs / 1000) % 60;
  const minutes = Math.floor(durationInMs / (1000 * 60)) % 60;
  const hours = Math.floor(durationInMs / (1000 * 60 * 60)) % 24;
  const days = Math.floor(durationInMs / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (seconds > 0) {
    parts.push(`${seconds}s`);
  }
  if (milliseconds > 0) {
    parts.push(`${milliseconds}ms`);
  }

  return parts.join(' ');
};

console.log(msToHumanReadable(45841));
