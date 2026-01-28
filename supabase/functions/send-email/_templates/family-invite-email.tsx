import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
  Section,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface FamilyInviteEmailProps {
  inviterName: string
  inviteUrl: string
}

export const FamilyInviteEmail = ({
  inviterName,
  inviteUrl,
}: FamilyInviteEmailProps) => (
  <Html>
    <Head />
    <Preview>You've been invited to join a Family Plan on Role Color Finder</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Family Plan Invitation</Heading>
        <Text style={text}>
          {inviterName} has invited you to join their Family Plan on Role Color Finder!
        </Text>
        <Text style={text}>
          As a family member, you'll get access to:
        </Text>
        <ul style={list}>
          <li>Unlimited assessment retakes</li>
          <li>Progress tracking dashboard</li>
          <li>All assessment types unlocked</li>
        </ul>
        <Section style={buttonContainer}>
          <Button style={button} href={inviteUrl}>
            Accept Invitation
          </Button>
        </Section>
        <Text style={{ ...text, color: '#ababab', marginTop: '24px' }}>
          If you don't want to join, you can simply ignore this email.
        </Text>
        <Text style={footer}>
          <Link
            href="https://rolecolorfinder.lovable.app"
            target="_blank"
            style={{ ...link, color: '#898989' }}
          >
            Role Color Finder
          </Link>
          - Discover your leadership color
        </Text>
      </Container>
    </Body>
  </Html>
)

export default FamilyInviteEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
}

const container = {
  paddingLeft: '12px',
  paddingRight: '12px',
  margin: '0 auto',
  maxWidth: '480px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
}

const list = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  paddingLeft: '20px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#9b87f5',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  padding: '12px 24px',
  display: 'inline-block',
}

const link = {
  color: '#2754C5',
  fontSize: '14px',
  textDecoration: 'underline',
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '32px',
  marginBottom: '24px',
  textAlign: 'center' as const,
}
