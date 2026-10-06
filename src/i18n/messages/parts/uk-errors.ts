/**
 * EN message → Ukrainian translation for errors that originate server-side:
 * zod schema messages (validated as-is by the test suite) and business errors
 * from server actions. Rendered through `localizeError()`; unmapped strings
 * fall back to English.
 */
export const errorsUk: Record<string, string> = {
  // Generic
  "Invalid input": "Некоректні дані",
  Required: "Обов’язкове поле",

  // Auth / register
  "Enter a valid email": "Введіть коректну email-адресу",
  "Password is required": "Введіть пароль",
  "Password must be at least 8 characters":
    "Пароль має містити щонайменше 8 символів",
  "Display name must be at least 2 characters":
    "Ім’я має містити щонайменше 2 символи",
  "Display name is too long": "Ім’я задовге",

  // Assets (seller form)
  "Title must be at least 5 characters":
    "Заголовок має містити щонайменше 5 символів",
  "Title is too long": "Заголовок задовгий",
  "Description must be at least 40 characters":
    "Опис має містити щонайменше 40 символів",
  "Description is too long": "Опис задовгий",
  "Jurisdiction must be a 2-letter ISO code":
    "Юрисдикція має бути 2-літерним кодом ISO",
  "Jurisdiction must be one of the supported ISO codes":
    "Юрисдикція має бути одним із підтримуваних кодів ISO",
  "Price cannot be negative": "Ціна не може бути від’ємною",
  "Value cannot be negative": "Значення не може бути від’ємним",
  "priceMin must not exceed priceMax":
    "Мінімальна ціна не може перевищувати максимальну",
  "Select at least one license type": "Оберіть щонайменше один тип ліцензії",
  "Select at least one jurisdiction": "Оберіть щонайменше одну юрисдикцію",
  "Missing asset": "Актив не знайдено",

  // Buyer profile / inquiries
  "Company must be at least 2 characters":
    "Назва компанії має містити щонайменше 2 символи",
  "Company is too long": "Назва компанії задовга",
  "Describe your interests in at least 20 characters":
    "Опишіть свої інтереси щонайменше в 20 символах",
  "Budget cannot be negative": "Бюджет не може бути від’ємним",
  "Minimum budget must not exceed maximum budget":
    "Мінімальний бюджет не може перевищувати максимальний",
  "Message must be at least 20 characters":
    "Повідомлення має містити щонайменше 20 символів",
  "Message is too long": "Повідомлення задовге",
  "Could not save profile — try again.":
    "Не вдалося зберегти профіль — спробуйте ще раз.",
  "This asset is no longer available.": "Цей актив більше недоступний.",
  "You already sent an inquiry for this asset.":
    "Ви вже надсилали запит щодо цього активу.",
  "Missing buyer": "Покупця не знайдено",
  "Missing user": "Користувача не знайдено",
  "Nothing to mark as read": "Немає чого позначати як прочитане",

  // Manager moderation
  "Member not found.": "Учасника не знайдено.",
  "Asset not found.": "Актив не знайдено.",
  "Listing is already in this state.": "Оголошення вже має цей статус.",
  "Member is already in this state.": "Учасник уже має цей статус.",
  "Manager accounts cannot be suspended or deleted.":
    "Акаунти менеджерів не можна призупиняти чи видаляти.",

  // Seller workspace
  "You can only manage your own listings.":
    "Ви можете керувати лише власними оголошеннями.",
  "Invalid save intent": "Некоректний намір збереження",
  "This buyer is no longer available.": "Цей покупець більше недоступний.",
  "You already sent a message to this buyer about this asset.":
    "Ви вже надсилали повідомлення цьому покупцю щодо цього активу.",
};
