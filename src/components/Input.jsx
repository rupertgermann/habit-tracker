import React from 'react'
import styled from 'styled-components'

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`

const StyledInput = styled.input`
  width: 100%;
  height: 48px;
  border: 1px solid ${props => {
    if (props.error) return props.theme.colors.destructive
    if (props.focused) return props.theme.colors.primary
    return props.theme.colors.border
  }};
  border-radius: ${props => props.theme.borderRadius.small};
  padding: 0 ${props => props.theme.spacing.md};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  color: ${props => props.theme.colors.text.primary};
  background-color: ${props => props.theme.colors.white};
  transition: all 0.2s ease;
  
  &::placeholder {
    color: ${props => props.theme.colors.text.secondary};
  }
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.background};
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  ${({ type }) =>
    type === 'time' &&
    `
      &::-webkit-calendar-picker-indicator {
        cursor: pointer;
      }
    `}
`

const CharacterCount = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  text-align: right;
  align-self: flex-end;
`

const ErrorMessage = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.destructive};
`

const Input = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  type = 'text',
  maxLength,
  showCharacterCount = false,
  className,
  ...props
}) => {
  const [focused, setFocused] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(value || '')

  React.useEffect(() => {
    setInternalValue(value || '')
  }, [value])

  const handleChange = (e) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  const handleFocus = () => {
    setFocused(true)
  }

  const handleBlur = () => {
    setFocused(false)
  }

  const remainingChars = maxLength ? maxLength - internalValue.length : 0

  return (
    <InputWrapper className={className}>
      {label && (
        <label
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: error ? '#F28A8A' : '#1A1A1A'
          }}
        >
          {label}
        </label>
      )}
      <StyledInput
        type={type}
        placeholder={placeholder}
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        error={error}
        focused={focused}
        disabled={disabled}
        maxLength={maxLength}
        {...props}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {showCharacterCount && maxLength && (
        <CharacterCount>
          {remainingChars} characters remaining
        </CharacterCount>
      )}
    </InputWrapper>
  )
}

export default Input