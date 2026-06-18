/**
 * FormValidator — Clase de validación de formularios profesional
 *
 * Uso:
 *   const v = new FormValidator()
 *     .field('email', [
 *       Validator.required('El email es obligatorio'),
 *       Validator.email('Email no válido'),
 *     ])
 *     .field('password', [
 *       Validator.required('La contraseña es obligatoria'),
 *       Validator.minLength(6, 'Mínimo 6 caracteres'),
 *     ]);
 *
 *   // Validación individual (onChange)
 *   v.validateField('email', 'test@test.com', formData);
 *   v.error('email'); // → null | 'mensaje de error'
 *
 *   // Validación completa (onSubmit)
 *   v.validateAll(formData); // → true si todo ok
 *   v.valid;      // → boolean
 *   v.hasErrors;  // → boolean
 *   v.errors;     // → { email: null, password: '...' }
 */

// ============================================================
// Reglas de validación (funciones estáticas)
// ============================================================
export class Validator {
  /** Campo obligatorio (no vacío) */
  static required(msg = 'Este campo es obligatorio') {
    return (value) => {
      if (value === null || value === undefined) return msg;
      if (typeof value === 'string' && value.trim() === '') return msg;
      if (typeof value === 'number' && isNaN(value)) return msg;
      return null;
    };
  }

  /** Formato de email válido */
  static email(msg = 'Introduce un email válido') {
    return (value) => {
      if (!value) return null;
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(value).trim()) ? null : msg;
    };
  }

  /** Longitud mínima de caracteres */
  static minLength(min, msg = `Mínimo ${min} caracteres`) {
    return (value) => {
      if (!value) return null;
      return String(value).length >= min ? null : msg;
    };
  }

  /** Longitud máxima de caracteres */
  static maxLength(max, msg = `Máximo ${max} caracteres`) {
    return (value) => {
      if (!value) return null;
      return String(value).length <= max ? null : msg;
    };
  }

  /** Valor mínimo numérico */
  static min(min, msg = `El valor mínimo es ${min}`) {
    return (value) => {
      if (value === '' || value === null || value === undefined) return null;
      return Number(value) >= min ? null : msg;
    };
  }

  /** Valor máximo numérico */
  static max(max, msg = `El valor máximo es ${max}`) {
    return (value) => {
      if (value === '' || value === null || value === undefined) return null;
      return Number(value) <= max ? null : msg;
    };
  }

  /** Teléfono (formato español: 9 dígitos, opcional +34) */
  static phone(msg = 'Introduce un teléfono válido (9 dígitos)') {
    return (value) => {
      if (!value) return null;
      const digits = String(value).replace(/\s+/g, '').replace(/^\+34/, '');
      return /^\d{9}$/.test(digits) ? null : msg;
    };
  }

  /** Patrón regex personalizado */
  static pattern(regex, msg = 'Formato no válido') {
    return (value) => {
      if (!value) return null;
      return regex.test(String(value).trim()) ? null : msg;
    };
  }

  /** Coincide con el valor de otro campo */
  static match(fieldName, msg = 'Los valores no coinciden') {
    return (value, allData) => {
      if (!value || !allData) return null;
      return String(value) === String(allData[fieldName]) ? null : msg;
    };
  }

  /** Función de validación personalizada */
  static custom(fn, msg = 'Valor no válido') {
    return (value, allData) => {
      return fn(value, allData) ? null : msg;
    };
  }

  /** Fecha de nacimiento: debe ser mayor de edad (18 años) */
  static adult(msg = 'Debes ser mayor de 18 años') {
    return (value) => {
      if (!value) return null;
      const birth = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        return age - 1 >= 18 ? null : msg;
      }
      return age >= 18 ? null : msg;
    };
  }

  /** Número de tarjeta (16 dígitos, formato Luhn básico) */
  static cardNumber(msg = 'Número de tarjeta no válido') {
    return (value) => {
      if (!value) return null;
      const digits = String(value).replace(/\s/g, '');
      if (!/^\d{16}$/.test(digits)) return msg;
      // Algoritmo de Luhn básico
      let sum = 0;
      let alternate = false;
      for (let i = digits.length - 1; i >= 0; i--) {
        let n = parseInt(digits[i], 10);
        if (alternate) {
          n *= 2;
          if (n > 9) n -= 9;
        }
        sum += n;
        alternate = !alternate;
      }
      return sum % 10 === 0 ? null : msg;
    };
  }

  /** CVV (3-4 dígitos) */
  static cvv(msg = 'CVV no válido (3-4 dígitos)') {
    return (value) => {
      if (!value) return null;
      return /^\d{3,4}$/.test(String(value)) ? null : msg;
    };
  }

  /** Fecha de expiración (MM/AA) — no expirada */
  static expiry(msg = 'Fecha de expiración no válida') {
    return (value) => {
      if (!value) return null;
      const parts = String(value).split('/');
      if (parts.length !== 2) return msg;
      const month = parseInt(parts[0], 10);
      const year = parseInt(parts[1], 10);
      if (month < 1 || month > 12) return msg;
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return 'La tarjeta está caducada';
      }
      return null;
    };
  }
}

// ============================================================
// Clase principal FormValidator
// ============================================================
export class FormValidator {
  constructor() {
    this._rules = {};       // { fieldName: [ruleFn, ...] }
    this._errors = {};      // { fieldName: 'error msg' | null }
    this._touched = {};     // { fieldName: true | false }
  }

  /**
   * Registrar reglas para un campo
   * @param {string} name - Nombre del campo
   * @param {Function[]} rules - Array de funciones de validación
   * @returns {FormValidator} - this (encadenable)
   */
  field(name, rules = []) {
    this._rules[name] = rules;
    this._errors[name] = null;
    this._touched[name] = false;
    return this;
  }

  /**
   * Registrar múltiples campos de una vez
   * @param {Object} schema - { fieldName: [rules], ... }
   * @returns {FormValidator} - this (encadenable)
   */
  fields(schema) {
    Object.entries(schema).forEach(([name, rules]) => {
      this.field(name, rules);
    });
    return this;
  }

  /**
   * Validar un campo individual (útil para onChange)
   * @param {string} name - Nombre del campo
   * @param {*} value - Valor actual
   * @param {Object} [allData] - Todos los datos del formulario (para reglas que necesitan contexto)
   * @returns {string|null} - Mensaje de error o null si pasa
   */
  validateField(name, value, allData = {}) {
    this._touched[name] = true;
    const rules = this._rules[name] || [];
    for (const rule of rules) {
      const error = rule(value, allData);
      if (error) {
        this._errors[name] = error;
        return error;
      }
    }
    this._errors[name] = null;
    return null;
  }

  /**
   * Validar todos los campos registrados
   * @param {Object} data - Todos los datos del formulario
   * @returns {boolean} - true si todos pasan, false si hay errores
   */
  validateAll(data) {
    let allValid = true;
    Object.keys(this._rules).forEach((name) => {
      this._touched[name] = true;
      const error = this.validateField(name, data[name], data);
      if (error) allValid = false;
    });
    return allValid;
  }

  /**
   * Obtener el error de un campo específico
   * @param {string} name
   * @returns {string|null}
   */
  error(name) {
    return this._touched[name] ? this._errors[name] : null;
  }

  /**
   * Obtener todos los errores
   * @returns {Object} - { fieldName: 'error' | null, ... }
   */
  get errors() {
    return { ...this._errors };
  }

  /**
   * ¿Todos los campos son válidos?
   * @returns {boolean}
   */
  get valid() {
    return Object.values(this._errors).every((e) => e === null);
  }

  /**
   * ¿Hay algún error?
   * @returns {boolean}
   */
  get hasErrors() {
    return Object.values(this._errors).some((e) => e !== null);
  }

  /**
   * Número de campos con error
   * @returns {number}
   */
  get errorCount() {
    return Object.values(this._errors).filter((e) => e !== null).length;
  }

  /**
   * Marcar un campo como tocado (para mostrar error aunque no se haya validado aún)
   * @param {string} name
   */
  touch(name) {
    this._touched[name] = true;
  }

  /**
   * Marcar todos los campos como tocados
   */
  touchAll() {
    Object.keys(this._rules).forEach((name) => {
      this._touched[name] = true;
    });
  }

  /**
   * Resetear el validador (errores y touched)
   */
  reset() {
    Object.keys(this._rules).forEach((name) => {
      this._errors[name] = null;
      this._touched[name] = false;
    });
  }

  /**
   * Obtener la clase CSS para un campo según su estado de validación
   * @param {string} name
   * @param {string} [baseClass='input-premium']
   * @returns {string}
   */
  inputClass(name, baseClass = 'input-premium') {
    const err = this.error(name);
    return err ? `${baseClass} border-red-500` : baseClass;
  }

  /**
   * Renderizar el mensaje de error para un campo
   * @param {string} name
   * @param {Object} [opts]
   * @param {string} [opts.className]
   * @returns {string|null} - HTML string o null
   */
  errorHTML(name, opts = {}) {
    const err = this.error(name);
    if (!err) return null;
    const cls = opts.className || 'text-xs text-red-500 mt-1 flex items-center gap-1';
    return `<p class="${cls}">
      <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      ${err}
    </p>`;
  }
}

export default FormValidator;
