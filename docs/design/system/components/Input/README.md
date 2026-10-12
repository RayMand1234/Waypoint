Text inputs collect the few details the flow needs: destination, dates, travelers, traveler names.

Markup: wrap in `<label class="wp-field">`, with `wp-field__label`, then `<input class="wp-input">`, then `wp-field__help` or `wp-field__error`. Set `aria-invalid="true"` on errors.

- The consumer provides the label, value, helper text and error.
- The outline is `border-strong` (3.6:1). The error state uses a `danger` outline plus a written error message.
- Prefer smart defaults and suggestions over empty fields. Every field typed costs time.
