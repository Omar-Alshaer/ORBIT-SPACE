export const brand = {
  name: "ORBIT",
  slogan: "Stay in your orbit. Keep progressing.",
  mascotBasePath: "/assets/Mascots",
} as const;

export const mascots = Array.from({ length: 10 }, (_, index) => ({
  id: `mas${index + 1}`,
  src: `${brand.mascotBasePath}/mas${index + 1}.svg`,
  alt: `ORBIT mascot ${index + 1}`,
}));
