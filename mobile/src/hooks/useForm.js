import { useState } from 'react';

// Custom hook: logika form yang bisa dipakai ulang (Modul 6).
// validate(values) mengembalikan objek error; {} berarti valid.
export default function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  // handleChange('email') → fungsi untuk onChangeText
  const handleChange = (field) => (text) => {
    setValues((prev) => ({ ...prev, [field]: text }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Untuk nilai non-teks: chip, toggle, stepper
  const setValue = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (onValid) => () => {
    const newErrors = validate ? validate(values) : {};
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) onValid(values);
  };

  const reset = (next = initialValues) => {
    setValues(next);
    setErrors({});
  };

  return { values, errors, handleChange, setValue, setValues, setErrors, handleSubmit, reset };
}
