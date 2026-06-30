import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Card from '../components/Card'
import AppIcon from '../components/AppIcon'

const PAGES = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated June 30, 2026',
    summary: 'Habit Tracker keeps your habit data in this app and gives you explicit export and restore controls.',
    sections: [
      {
        title: 'Data Stored',
        body: 'The app stores habits, categories, journal entries, profile details, theme preference, notification preference, and backup settings.'
      },
      {
        title: 'Data Use',
        body: 'Your data is used to render habit tracking, streaks, progress summaries, journal timelines, settings, backups, and restores.'
      },
      {
        title: 'Your Controls',
        body: 'Use Settings to export, back up, restore, or clear your data. Browser notifications are only used after you grant permission.'
      }
    ]
  },
  terms: {
    title: 'Terms of Service',
    updated: 'Last updated June 30, 2026',
    summary: 'Habit Tracker is provided as a personal tracking tool for recording habits, completions, and reflections.',
    sections: [
      {
        title: 'Use',
        body: 'Use the app for personal habit tracking and journaling. You are responsible for reviewing exported backups before sharing them.'
      },
      {
        title: 'Data Management',
        body: 'Backup, restore, and clear-all actions change the stored app data immediately. Keep separate backup copies for anything important.'
      },
      {
        title: 'No Professional Advice',
        body: 'Progress summaries and streaks are informational only and are not medical, legal, financial, or professional advice.'
      }
    ]
  },
  support: {
    title: 'Support',
    updated: 'Habit Tracker v1.0.0',
    summary: 'For help with Habit Tracker, include the screen, the action you tried, and what happened.',
    sections: [
      {
        title: 'Before Reporting',
        body: 'Try refreshing the app, then check whether the issue still happens after exporting a backup and restarting the local server.'
      },
      {
        title: 'Useful Details',
        body: 'Include your browser, device size, the Settings or habit screen involved, and whether the problem affects saved data.'
      },
      {
        title: 'Project Issues',
        body: 'Support requests and bugs for this app are tracked in the GitHub issue tracker for the repository.'
      }
    ],
    action: {
      href: 'https://github.com/rupertgermann/habit-tracker/issues',
      label: 'Open GitHub Issues'
    }
  }
}

const PageContainer = styled.div`
  width: 100%;
  padding: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.xxxl};
  max-width: 600px;
  margin: 0 auto;
`

const Header = styled.header`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
`

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};

  &:hover {
    text-decoration: underline;
  }

  &:focus {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }
`

const Title = styled.h1`
  font-size: ${props => props.theme.typography.fontSize.headingLarge};
`

const SummaryCard = styled(Card)`
  margin-bottom: ${props => props.theme.spacing.lg};
`

const Summary = styled.p`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.bodyLarge};
  line-height: ${props => props.theme.typography.lineHeight.relaxed};
  margin-bottom: ${props => props.theme.spacing.sm};
`

const Updated = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.bodySmall};
`

const SectionList = styled.div`
  display: grid;
  gap: ${props => props.theme.spacing.md};
`

const InfoSection = styled(Card)`
  padding: ${props => props.theme.spacing.lg};
`

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.headingMedium};
  margin-bottom: ${props => props.theme.spacing.sm};
`

const SectionBody = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  line-height: ${props => props.theme.typography.lineHeight.relaxed};
`

const ExternalAction = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  margin-top: ${props => props.theme.spacing.md};
  padding: 0 ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.small};
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.white};
  font-size: ${props => props.theme.typography.fontSize.bodyMedium};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  text-decoration: none;

  &:hover {
    background-color: #5CAD6C;
  }

  &:focus {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }
`

const InfoPage = ({ page }) => {
  const content = PAGES[page] || PAGES.support

  return (
    <PageContainer>
      <Header>
        <BackLink to="/settings">
          <AppIcon name="chevron-left" size={18} />
          Back to Settings
        </BackLink>
        <Title>{content.title}</Title>
      </Header>

      <SummaryCard elevated>
        <Summary>{content.summary}</Summary>
        <Updated>{content.updated}</Updated>
      </SummaryCard>

      <SectionList>
        {content.sections.map(section => (
          <InfoSection key={section.title} elevated>
            <SectionTitle>{section.title}</SectionTitle>
            <SectionBody>{section.body}</SectionBody>
            {section.title === 'Project Issues' && content.action ? (
              <ExternalAction
                href={content.action.href}
                target="_blank"
                rel="noreferrer"
              >
                {content.action.label}
              </ExternalAction>
            ) : null}
          </InfoSection>
        ))}
      </SectionList>
    </PageContainer>
  )
}

export default InfoPage
