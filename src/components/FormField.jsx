import "./FormField.css";


export default function FormField({

  label,

  type = "text",

  value,

  onChange,

  placeholder,

  error,

  autoComplete,

  inputMode,

  maxLength,

  minLength,

  name,

  disabled = false,

  required = false,

}) {


  // -------------------------------------------------------------
  // ACCESSIBILITY IDS
  // -------------------------------------------------------------

  const errorId =
    error && name
      ? `${name}-error`
      : undefined;


  return (

    <div className="field">


      {/* ---------------------------------------------------------
          LABEL
      ---------------------------------------------------------- */}

      <label

        className="field-label"

        htmlFor={
          name
        }

      >

        {label}

      </label>


      {/* ---------------------------------------------------------
          INPUT
      ---------------------------------------------------------- */}

      <input

        id={
          name
        }

        name={
          name
        }

        type={
          type
        }

        className={

          `field-input${
            error
              ? " field-input-error"
              : ""
          }`

        }

        value={
          value
        }

        onChange={
          onChange
        }

        placeholder={
          placeholder
        }

        autoComplete={
          autoComplete
        }

        inputMode={
          inputMode
        }

        maxLength={
          maxLength
        }

        minLength={
          minLength
        }

        disabled={
          disabled
        }

        required={
          required
        }

        aria-invalid={
          error
            ? "true"
            : "false"
        }

        aria-describedby={
          errorId
        }

      />


      {/* ---------------------------------------------------------
          FIELD ERROR
      ---------------------------------------------------------- */}

      {error && (

        <p

          id={
            errorId
          }

          className="field-error"

          role="alert"

        >

          {error}

        </p>

      )}


    </div>

  );

}