export function contrastInk(hex) {
  const channels = /^#[a-f0-9]{6}$/i.test(hex || '') ? hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255) : [0, 0, 0];
  const linear = channels.map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  const light = linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
  return (light + .05) / .05 >= 1.05 / (light + .05) ? '#000000' : '#ffffff';
}
