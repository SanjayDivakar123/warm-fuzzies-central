import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ResetPasswordEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
}

export const ResetPasswordEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your Role Color Finder password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset Your Password 🔐</Heading>
        
        <Text style={text}>
          We received a request to reset your password for your Role Color Finder account. Click the button below to create a new password:
        </Text>

        <Section style={buttonContainer}>
          <Link
            href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
            target="_blank"
            style={button}
          >
            Reset Password
          </Link>
        </Section>

        <Hr style={hr} />

        <Text style={text}>
          Or, copy and paste this reset code:
        </Text>
        
        <code style={code}>{token}</code>

        <Text style={smallText}>
          This link and code will expire in 1 hour for security reasons.
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </Text>

        <Text style={footer}>
          <Link
            href="https://rolecolorfinder.com"
            target="_blank"
            style={footerLink}
          >
            Role Color Finder
          </Link>
          {' '}- Discover Your Leadership Personality
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ResetPasswordEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
  lineHeight: '1.4',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 40px',
}

const smallText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '16px 40px',
}

const buttonContainer = {
  padding: '27px 40px',
}

const button = {
  backgroundColor: '#8B5CF6',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 24px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 40px',
}

const code = {
  display: 'inline-block',
  padding: '16px 4.5%',
  width: '90.5%',
  backgroundColor: '#f4f4f4',
  borderRadius: '6px',
  border: '1px solid #e6ebf1',
  color: '#333',
  fontFamily: 'monospace',
  fontSize: '18px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  textAlign: 'center' as const,
  margin: '0 40px',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 40px',
}

const footerLink = {
  color: '#8B5CF6',
  textDecoration: 'underline',
}
