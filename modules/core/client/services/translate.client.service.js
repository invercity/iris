'use strict';

angular.module('core').factory('t', [function () {
  return {
    ERR: 'Помилка',
    FORBIDDEN: 'Заборонено',
    BAD_REQUEST: 'Помилка запиту',
    ERR_404: 'Такої сторінки не існує',
    ERR_403: 'У вас немаэ прав для доступу до цієї сторінки',
    ERR_400: 'Щось пішло не так... спробуйте перезавантажити сторінку',
    UAH: '₴',
    MENU_ADMIN: 'Адмініcтрування',
    MENU_ENTER: 'Вхід',
    MENU_EDIT_PROFILE: 'Редагування профілю',
    MENU_CHANGE_PWD: 'Змінити пароль',
    MENU_EXIT: 'Вихід',
    MENU_GOODS: 'Товари',
    MENU_PLACES: 'Місця',
    MENU_ORDERS: 'Замовлення',
    MENU_CLIENTS: 'Клієнти',
    ENTER_COUNT: 'Введіть кількість',
    GOOD_EDIT: 'Редагувати товар',
    GOOD_NEW: 'Створити товар',
    GOOD_ADD: 'Додати товар',
    GOOD_ENTER_COUNT: 'Введіть кількість:',
    ORDER_TYPE_NEW: 'Нові',
    ORDER_TYPE_PAYED: 'Оплачені',
    ORDER_TYPE_ALL: 'Всі',
    ORDER_STATUS_NEW: 'Нові',
    ORDER_STATUS_READY: 'Готові',
    ORDER_STATUS_TOGO: 'Можна збирати',
    ORDER_STATUS_DONE: 'Зібрані',
    ORDER_STATUS_SENT: 'Відправлено',
    ORDER_STATUS_CARE: 'Зберігання',
    ORDER_STATUS_SELF: 'Самовивіз',
    ORDER_STATUS_OUT: 'Роздача',
    CLIENT_NEW: 'Додати клієнта',
    CLIENT_EDIT: 'Редагувати клыэнта',
    OK: 'Так',
    CANCEL: 'Скасувати',
    CONFIRM: 'Підтвердження',
    REMOVE_ORDER_CONF: 'Видалити дане замовлення?',
    PAY_ORDER_CONF: 'Оплатити дане замовлення?',
    SEND_ORDER_CONF: 'Відправити дане замовлення?',
    EDIT_ORDER_NUM: 'Редагувати замовлення #',
    NEW_ORDER: 'Нове замовлення',
    EDIT_MANUALLY: 'Ввести вручну',
    EDIT_PLACE: 'Редагування місця видачі',
    NEW_PLACE: 'Нове місце видачі',
    NAME: 'Назва',
    P_NAME: 'Ім\'я',
    REQUIRED: 'обов\'язково.',
    DESC: 'Деталі',
    PRICE: 'Ціна',
    COUNT: 'Кількість',
    TYPE: 'Тип',
    SAVE: 'Зберегти',
    GOODS: 'Товари',
    ORDERS: 'Замовлення',
    ORDERS_LIST: 'Замовлення',
    SEARCH: 'Пошук',
    LINK_TO_ORDER: 'Посилання на замовлення',
    CLIENT_SELECT_CREATE: 'Клієнт (створити нового якщо не вибрано)',
    CLIENT: 'Клієнт',
    STATUS: 'Статус',
    SELECT_NAME: 'Введіть ім\'я або виберіть зі списку',
    SELECT_PLACE: 'Введіть місце або виберіть зі списку',
    SURNAME: 'Прізвище',
    PHONE: 'Телефон',
    PLACE_DELIVER: 'Місця видачі',
    ADDRESS: 'Адреса',
    LEFT: 'Залишок',
    TOTAL: 'Сума',
    SALE: 'Знижка',
    DEBT: 'Борг',
    TO_PAY: 'Оплатити',
    TOTAL_PRICE: 'Загальна сума:',
    ORDER_TYPES: 'Типи замовлень',
    ORDER_STATUS: 'Статус замовлень',
    ORDER_NUM: 'Замовлення #',
    CLIENT_LAB: 'Клієнт: ',
    IS_PAYED: 'Оплачений',
    IS_NOT_PAYED: 'Не оплачений',
    GOODS_LIST: 'Список товарів:',
    GOOD: 'Товар',
    TOTAL_PAY: 'Сума до сплати: ',
    ADDITIONAL: 'Додатково %',
    ADD: 'Додати',
    CREATED: 'Створений',
    ENTER_KEY_FOR_SEARCH: 'Введіть ключ для пошуку',
    AUTH: 'Авторизація',
    LOGIN: 'Логін',
    PASS: 'Пароль',
    P_FIRST: '<<',
    P_LAST: '>>',
    P_PREV: '<',
    P_NEXT: '>',
    ADDED: 'Доданий',
    ITEMS_LEFT: 'Залишилося',
    ROLES: 'Ролі',
    USERS: 'Користувачі',
    USER: 'Користувач',
    ERR_ADD_ROLE: 'Додайте хоча б одну роль',
    SETTINGS: 'Налаштування',
    EDIT_PROFILE: 'Редагувати профідь',
    EDIT_PHOTO: 'Редагувати фото',
    EDIT_PASS: 'Редагувати пароль',
    INVALID_EMAIL: 'Невырний e-mail',
    PROFILE_SAVED_SUCCESSFULLY: 'Профіль успішно збережений',
    CHOOSE_PHOTO: 'Виберіть фото',
    PHOTO_SAVED_SUCCESSFULLY: 'Фотографія успішно збережена',
    CURRENT_PASS: 'Поточний пароль',
    NEW_PASS: 'Новий пароль',
    CONFIRM_PASS: 'Підтвердіть новий пароль',
    CONFIRM_PASS_HELP: 'Введіть новий пароль ще раз',
    CONFIRM_PASS_ERR: 'Паролі не співпадають',
    PASS_REQUIREMENTS: 'Вимоги до пароля',
    PASS_SAVED_SUCCESSFULLY: 'Пароль успішно збережений',
    ADD_SALES: 'Додати знижки',
    ADD_CLIENT: 'Додати клієнта',
    EDIT_CLIENT: 'Редагувати клієнта',
    PLACE_DELIVER_DEFAULT: 'Місце отримання за замовчуванням',
    TOTAL_ORDERS_TO_SHOW: 'Показано замовлень',
    ACTIVE: 'Активний',
    BAR: 'IRIS',
    VOLUME: 'Об\'єм, мл',
    COMMENTS: 'Коментарі',
    GOOD_OLD_TYPES: 'Залишок'
  };
}]);
