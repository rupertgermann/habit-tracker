import React from 'react'
import styled from 'styled-components'
import { useHabits } from '../context/HabitsContext'

const CategorySelectorContainer = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`

const CategoryLabel = styled.label`
  display: block;
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
`

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: ${props => props.theme.spacing.sm};
`

const CategoryOption = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.medium};
  border: 2px solid ${props => props.selected ? props.theme.colors.primary : props.theme.colors.border};
  background-color: ${props => props.selected ? `${props.theme.colors.primary}10` : props.theme.colors.white};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.subtle};
  }
`

const CategoryIcon = styled.div`
  font-size: 24px;
  margin-bottom: ${props => props.theme.spacing.xs};
`

const CategoryName = styled.span`
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
  text-align: center;
  color: ${props => props.theme.colors.text.primary};
`

const CategorySelector = ({ selectedCategory, onCategoryChange }) => {
  const { categories } = useHabits()

  return (
    <CategorySelectorContainer>
      <CategoryLabel>Category</CategoryLabel>
      <CategoryGrid>
        {categories.map((category) => (
          <CategoryOption
            key={category.id}
            selected={selectedCategory === category.id}
            onClick={() => onCategoryChange(category.id)}
          >
            <CategoryIcon>{category.icon}</CategoryIcon>
            <CategoryName>{category.name}</CategoryName>
          </CategoryOption>
        ))}
      </CategoryGrid>
    </CategorySelectorContainer>
  )
}

export default CategorySelector