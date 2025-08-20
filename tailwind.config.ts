import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'poppins': ['Poppins', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				'steel-black': {
					DEFAULT: 'hsl(var(--steel-black))',
					foreground: 'hsl(var(--steel-black-foreground))',
					light: 'hsl(var(--steel-black-light))',
					dark: 'hsl(var(--steel-black-dark))'
				},
				red: {
					DEFAULT: 'hsl(var(--red))',
					foreground: 'hsl(var(--red-foreground))',
					light: 'hsl(var(--red-light))',
					dark: 'hsl(var(--red-dark))'
				},
				green: {
					DEFAULT: 'hsl(var(--green))',
					foreground: 'hsl(var(--green-foreground))',
					light: 'hsl(var(--green-light))',
					dark: 'hsl(var(--green-dark))'
				},
				yellow: {
					DEFAULT: 'hsl(var(--yellow))',
					foreground: 'hsl(var(--yellow-foreground))',
					light: 'hsl(var(--yellow-light))',
					dark: 'hsl(var(--yellow-dark))'
				},
				blue: {
					DEFAULT: 'hsl(var(--blue))',
					foreground: 'hsl(var(--blue-foreground))',
					light: 'hsl(var(--blue-light))',
					dark: 'hsl(var(--blue-dark))'
				},
				white: {
					DEFAULT: 'hsl(var(--white))',
					foreground: 'hsl(var(--white-foreground))'
				},
				black: {
					DEFAULT: 'hsl(var(--black))',
					foreground: 'hsl(var(--black-foreground))'
				}
			},
			backgroundImage: {
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-red': 'var(--gradient-red)',
				'gradient-green': 'var(--gradient-green)',
				'gradient-yellow': 'var(--gradient-yellow)',
				'gradient-blue': 'var(--gradient-blue)',
				'gradient-steel': 'var(--gradient-steel)',
				'gradient-brand': 'var(--gradient-brand)'
			},
			boxShadow: {
				'elegant': 'var(--shadow-elegant)',
				'colorful': 'var(--shadow-colorful)',
				'glow': 'var(--shadow-glow)',
				'red': 'var(--shadow-red)',
				'yellow': 'var(--shadow-yellow)',
				'green': 'var(--shadow-green)',
				'blue': 'var(--shadow-blue)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0', opacity: '0' },
					to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
					to: { height: '0', opacity: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-out': {
					'0%': { opacity: '1', transform: 'translateY(0)' },
					'100%': { opacity: '0', transform: 'translateY(10px)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'scale-out': {
					from: { transform: 'scale(1)', opacity: '1' },
					to: { transform: 'scale(0.95)', opacity: '0' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-out-right': {
					'0%': { transform: 'translateX(0)' },
					'100%': { transform: 'translateX(100%)' }
				},
				'bounce-gentle': {
					'0%, 100%': { transform: 'translateY(-2px)' },
					'50%': { transform: 'translateY(0px)' }
				},
				'glow-pulse': {
					'0%, 100%': { boxShadow: '0 0 20px hsl(var(--yellow-glow) / 0.3)' },
					'50%': { boxShadow: '0 0 40px hsl(var(--yellow-glow) / 0.6)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'scale-out': 'scale-out 0.2s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'slide-out-right': 'slide-out-right 0.3s ease-out',
				'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")]
} satisfies Config;
