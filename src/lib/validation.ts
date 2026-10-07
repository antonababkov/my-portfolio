import { z } from "zod";

const optionalText = (max: number) => z.string().max(max).optional();

const projectLinkValue = z
  .string()
  .max(500)
  .url("Некорректная ссылка")
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "https:" || protocol === "http:";
    } catch {
      return false;
    }
  }, "Ссылка может вести только на http/https");

/** Пустая строка из формы — это «без ссылки» (null), а не ошибка валидации. */
const projectLink = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  projectLinkValue.nullable().optional()
);

/** Обновление проекта: хотя бы одно поле, все — опциональны. */
export const ProjectUpdateSchema = z
  .object({
    title: optionalText(200).refine((v) => v === undefined || v.trim() !== "", "Введите название"),
    description: optionalText(5000).refine((v) => v === undefined || v.trim() !== "", "Введите описание"),
    link: projectLink,
  })
  .refine(
    (v) =>
      v.title !== undefined || v.description !== undefined || v.link !== undefined,
    "No fields to update provided"
  );

/** Создание проекта: title и description обязательны. */
export const ProjectCreateSchema = z.object({
  title: z.string().min(1, "Введите название").max(200),
  description: z.string().min(1, "Введите описание").max(5000),
  link: projectLink,
});

/** Обновление профиля: валидация всех полей. */
export const ProfileUpdateSchema = z.object({
  fullName: z.string().min(1, "Введите имя").max(200),
  position: z.string().min(1, "Введите должность").max(200),
  description: z.string().min(1, "Введите описание").max(10_000),
  sliderAutoPlay: z.boolean().optional(),
  siteTitle: optionalText(300),
  siteDescription: optionalText(300),
  email: optionalText(254).refine((value) => {
    if (value === undefined || value.trim() === "") return true;
    return z.email("Некорректный email").safeParse(value).success;
  }, "Некорректный email"),
  phone: optionalText(50),
  aboutExtraTitle: optionalText(200),
  aboutExtra: optionalText(10_000),
  aboutExtraVisible: z.boolean().optional(),
  privacyPolicy: optionalText(20_000),
  personalDataPolicy: optionalText(20_000),
  operatorAddress: optionalText(500),
});