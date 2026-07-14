import React, { useState } from 'react'
import styled from 'styled-components'
import AppIcon from './AppIcon'

export const SELECT_DROPDOWN_CONTROL_WIDTH = '128px'

const SelectWrapper = styled.div`
  position: relative;
  width: ${props => props.$fullWidth ? '100%' : SELECT_DROPDOWN_CONTROL_WIDTH};
  flex: ${props => props.$fullWidth ? '1 1 auto' : `0 0 ${SELECT_DROPDOWN_CONTROL_WIDTH}`};
  min-width: 0;
`

const SelectButton = styled.button`
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.$open ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.small};
  padding: 0 ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  background-color: ${props => props.theme.colors.white};
  font-family: ${props => props.theme.typography.monoFamily};
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: inset 5px 0 0 ${props => props.theme.colors.primary};
  }
`

const SelectedLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
`

const SelectChevron = styled.span`
  display: inline-flex;
  flex: 0 0 auto;
  color: ${props => props.theme.colors.text.primary};
  transform: ${props => props.$open ? 'rotate(-90deg)' : 'rotate(90deg)'};
  transition: transform 0.2s ease;
`

const SelectMenu = styled.div`
  position: absolute;
  top: calc(100% + ${props => props.theme.spacing.xs});
  left: 0;
  right: 0;
  z-index: 20;
  display: grid;
  gap: ${props => props.theme.spacing.xs};
  max-height: 240px;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.xs};
  border: 1px solid ${props => props.theme.colors.borderStrong};
  border-radius: 0;
  background-color: ${props => props.theme.colors.white};
  box-shadow: ${props => props.theme.shadows.strong};
`

const SelectOption = styled.button`
  width: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  border: 0;
  border-radius: ${props => props.theme.borderRadius.small};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.$selected
    ? (props.theme.mode === 'dark' ? '#111411' : props.theme.colors.onPrimary)
    : props.theme.colors.text.primary};
  background-color: ${props => props.$selected ? props.theme.colors.primary : props.theme.colors.white};
  font-family: ${props => props.theme.typography.fontFamily};
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus {
    outline: none;
    color: ${props => props.$selected
      ? (props.theme.mode === 'dark' ? '#111411' : props.theme.colors.onPrimary)
      : props.theme.colors.text.primary};
    background-color: ${props => props.$selected ? props.theme.colors.primary : `${props.theme.colors.primary}20`};
  }
`

const SelectDropdown = ({
  ariaLabel,
  value,
  options,
  onChange,
  fullWidth = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(option => option.value === value) || options[0]

  const handleSelect = (nextValue) => {
    onChange(nextValue)
    setIsOpen(false)
  }

  return (
    <SelectWrapper
      className={className}
      $fullWidth={fullWidth}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false)
        }
      }}
    >
      <SelectButton
        type="button"
        $open={isOpen}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(current => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setIsOpen(false)
          if (event.key === 'ArrowDown') setIsOpen(true)
        }}
      >
        <SelectedLabel>{selectedOption?.label || ''}</SelectedLabel>
        <SelectChevron $open={isOpen} aria-hidden="true">
          <AppIcon name="chevron-right" size={18} />
        </SelectChevron>
      </SelectButton>

      {isOpen && (
        <SelectMenu role="listbox" aria-label={ariaLabel}>
          {options.map(option => (
            <SelectOption
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              $selected={option.value === value}
              onMouseDown={event => event.preventDefault()}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </SelectOption>
          ))}
        </SelectMenu>
      )}
    </SelectWrapper>
  )
}

export default SelectDropdown
