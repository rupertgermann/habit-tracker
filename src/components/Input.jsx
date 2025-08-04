import React from 'react'
import styled from 'styled-components'

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  width: 100%;
`

const Label = styled.label`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  color: ${props => props.theme.colors.text.primary};
  
  ${({ required }) =>
    required &&
    `
      &::after {
        content: ' *';
        color: ${props => props.theme.colors.destructive};
      }
    `}
`

const InputField = styled.input`
  height: 48px;
  border-radius: ${props => props.theme.borderRadius.small};
  border: 1px solid ${props => props.theme.colors.border};
  padding: 0 ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  background-color: ${props => props.theme.colors.white};
  transition: border-color 0.2s ease;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
  
  ${({ error, theme }) =>
    error &&
    `
      border-color: ${theme.colors.destructive};
    `}
  
  ${({ disabled, theme }) =>
    disabled &&
    `
      background-color: ${theme.colors.background};
      opacity: 0.5;
      cursor: not-allowed;
    `}
`

const ErrorMessage = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.destructive};
  margin-top: ${props => props.theme.spacing.xs};
`

const CharacterCount = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  color: ${props => props.theme.colors.text.secondary};
  text-align: right;
  margin-top: ${props => props.theme.spacing.xs};
`

const Input = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  type = 'text',
  maxLength,
  showCharacterCount = false,
  ...props
}) => {
  const handleChange = (e) => {
    onChange(e.target.value)
  }

  return (
    <InputWrapper>
      {label && (
        <Label required={required}>
          {label}
        </Label>
      )}
      <InputField
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        error={!!error}
        disabled={disabled}
        maxLength={maxLength}
        {...props}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {showCharacterCount && maxLength && (
        <CharacterCount>
          {value.length}/{maxLength}
        </CharacterCount>
      )}
    </InputWrapper>
  )
}

export default Input