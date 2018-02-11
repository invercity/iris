'use strict';

angular.module('core').factory('t', [function () {
  return {
    ERR: 'Помилка',
    UAH: '₴',
    MENU_ADMIN: 'Адмініcтрування',
    MENU_ENTER: 'Вхід',
    MENU_EDIT_PROFILE: 'Редагування профілю',
    MENU_CHANGE_PWD: 'Змінити пароль',
    MENU_EXIT: 'Вихід',
    MENU_GOODS: 'Товари',
    MENU_PLACES: 'Місця',
    MENU_ORDERS: 'Замовлення',
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
    ORDER_STATUS_TOGO: 'Можно збирати',
    ORDER_STATUS_DONE: 'Зібрані',
    OK: 'Так',
    CANCEL: 'Відміна',
    CONFIRM: 'Підтвердження',
    REMOVE_ORDER_CONF: 'Видалити дане замовлення?',
    PAY_ORDER_CONF: 'Оплатити дане замовлення?',
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
    ORDERS: 'Списки',
    ORDERS_LIST: 'Замовлення',
    SEARCH: 'Пошук',
    LINK_TO_ORDER: 'Посилання на замовлення',
    CLIENT_SELECT_CREATE: 'Клієнт (створити нового якщо не вибрано)',
    STATUS: 'Статус',
    SELECT_NAME: 'Введіть ім\'я або виберіть зі списку',
    SELECT_PLACE: 'Введіть місце або виберіть зі списку',
    SURNAME: 'Прізвище',
    PHONE: 'Телефон',
    PLACE_DELIVER: 'Місце видачі',
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
    ADD: 'Додати',
    P_FIRST: '<<',
    P_LAST: '>>',
    P_PREV: '<',
    P_NEXT: '>'
  };
}]);