// Подстановка реквизитов оператора в тексты политик.
// Плейсхолдеры в template (см. constants.ts) заменяются значениями из профиля.

export type PolicyTemplateData = {
  fullName: string;
  email: string;
  phone: string;
  operatorAddress: string;
};

const PLACEHOLDERS: Record<keyof PolicyTemplateData, RegExp> = {
  fullName: /\{\{fullName\}\}/g,
  email: /\{\{email\}\}/g,
  phone: /\{\{phone\}\}/g,
  operatorAddress: /\{\{operatorAddress\}\}/g,
};

export const FULL_NAME_FALLBACK = "Владелец сайта";
export const OPERATOR_ADDRESS_FALLBACK = "адрес уточняется по запросу";

export function renderPolicyTemplate(
  template: string,
  data: PolicyTemplateData,
): string {
  return template
    .replace(PLACEHOLDERS.fullName, data.fullName.trim() || FULL_NAME_FALLBACK)
    .replace(PLACEHOLDERS.email, data.email.trim())
    .replace(PLACEHOLDERS.phone, data.phone.trim())
    .replace(
      PLACEHOLDERS.operatorAddress,
      data.operatorAddress.trim() || OPERATOR_ADDRESS_FALLBACK,
    );
}