import React from 'react'
import styled, { css } from 'styled-components'

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`

const controlStyles = css`
  width: 100%;
  border: 1px solid ${props => {
    if (props.$error) return props.theme.colors.destructive
    if (props.$focused) return props.theme.colors.primary
    return props.theme.colors.border
  }};
  border-radius: ${props => props.theme.borderRadius.small};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  color: ${props => props.theme.colors.text.primary};
  background-color: ${props => props.theme.colors.white};
  transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
  
  &::placeholder {
    color: ${props => props.theme.colors.text.secondary};
  }
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: inset 5px 0 0 ${props => props.theme.colors.primary};
  }
  
  &:disabled {
    background-color: ${props => props.theme.colors.background};
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  ${({ type, theme }) =>
    type === 'time' &&
    css`
      color-scheme: ${theme.mode === 'dark' ? 'dark' : 'light'};

      &::-webkit-calendar-picker-indicator {
        cursor: pointer;
        filter: ${theme.mode === 'dark' ? 'invert(1)' : 'none'};
        opacity: ${theme.mode === 'dark' ? '0.85' : '0.75'};
      }
    `}
`

const StyledInput = styled.input`
  ${controlStyles}
  height: 48px;
  padding: 0 ${props => props.$clearable ? props.theme.spacing.xxl : props.theme.spacing.md} 0 ${props => props.theme.spacing.md};
`

const StyledTextarea = styled.textarea`
  ${controlStyles}
  min-height: 120px;
  padding: ${props => props.theme.spacing.md};
  padding-right: ${props => props.$clearable ? props.theme.spacing.xxl : props.theme.spacing.md};
  line-height: ${props => props.theme.typography.lineHeight.normal};
  resize: vertical;
`

const ControlFrame = styled.div`
  position: relative;
`

const ClearButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.sm};
  right: ${props => props.theme.spacing.sm};
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: transparent;
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  line-height: 1;

  &:hover {
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text.primary};
  }
`

const InputLabel = styled.label`
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${props => props.$error ? props.theme.colors.destructive : props.theme.colors.text.primary};
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
  multiline = false,
  rows = 4,
  clearable = false,
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

  const handleClear = () => {
    setInternalValue('')
    if (onChange) {
      onChange('')
    }
  }

  const remainingChars = maxLength ? maxLength - internalValue.length : 0
  const Control = multiline ? StyledTextarea : StyledInput

  return (
    <InputWrapper className={className}>
      {label && (
        <InputLabel $error={Boolean(error)}>
          {label}
        </InputLabel>
      )}
      <ControlFrame>
        <Control
          type={multiline ? undefined : type}
          placeholder={placeholder}
          value={internalValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          $error={Boolean(error)}
          $focused={focused}
          $clearable={clearable}
          disabled={disabled}
          maxLength={maxLength}
          rows={multiline ? rows : undefined}
          {...props}
        />
        {clearable && internalValue && !disabled && (
          <ClearButton
            type="button"
            onClick={handleClear}
            aria-label="Clear input"
          >
            ×
          </ClearButton>
        )}
      </ControlFrame>
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
