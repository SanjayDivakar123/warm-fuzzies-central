import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface NewEmployeeNotificationProps {
  adminName: string;
  employeeEmail: string;
  companyName: string;
  dashboardUrl: string;
}

export const NewEmployeeNotificationEmail = ({
  adminName,
  employeeEmail,
  companyName,
  dashboardUrl,
}: NewEmployeeNotificationProps) => (
  <Html>
    <Head />
    <Preview>New team member joined {companyName} via Google SSO</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Team Member Joined</Heading>
        
        <Text style={text}>
          Hi {adminName || 'Admin'},
        </Text>
        
        <Text style={text}>
          A new team member has joined <strong>{companyName}</strong> via Google SSO:
        </Text>
        
        <Section style={infoBox}>
          <Text style={infoText}>
            <strong>Email:</strong> {employeeEmail}
          </Text>
          <Text style={infoText}>
            <strong>Joined via:</strong> Google SSO (auto-enrollment)
          </Text>
        </Section>
        
        <Text style={text}>
          They will now be able to take the Role Color assessment. You can view and manage team members in your admin dashboard.
        </Text>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          This notification was sent because Google SSO auto-enrollment is enabled for {companyName}.
          You can manage SSO settings in your company dashboard.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default NewEmployeeNotificationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  maxWidth: '600px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  marginBottom: '24px',
}

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '16px 0',
}

const infoBox = {
  backgroundColor: '#f0f7ff',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
  borderLeft: '4px solid #3b82f6',
}

const infoText = {
  color: '#1a1a1a',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '8px 0',
}

const hr = {
  borderColor: '#e6e6e6',
  margin: '32px 0 16px',
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '1.5',
}
