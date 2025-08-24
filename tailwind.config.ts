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
				sans: ['Poppins', 'sans-serif'],
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
				yellow: {
					DEFAULT: 'hsl(var(--yellow))',
					foreground: 'hsl(var(--yellow-foreground))',
					light: 'hsl(var(--yellow-light))',
					dark: 'hsl(var(--yellow-dark))',
					glow: 'hsl(var(--yellow-glow))'
				},
				red: {
					DEFAULT: 'hsl(var(--red))',
					foreground: 'hsl(var(--red-foreground))',
					light: 'hsl(var(--red-light))',
					dark: 'hsl(var(--red-dark))',
					glow: 'hsl(var(--red-glow))'
				},
				green: {
					DEFAULT: 'hsl(var(--green))',
					foreground: 'hsl(var(--green-foreground))',
					light: 'hsl(var(--green-light))',
					dark: 'hsl(var(--green-dark))',
					glow: 'hsl(var(--green-glow))'
				},
				blue: {
					DEFAULT: 'hsl(var(--blue))',
					foreground: 'hsl(var(--blue-foreground))',
					light: 'hsl(var(--blue-light))',
					dark: 'hsl(var(--blue-dark))',
					glow: 'hsl(var(--blue-glow))'
				},
				footer: 'hsl(var(--footer))'
			},
			backgroundImage: {
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-yellow': 'var(--gradient-yellow)',
				'gradient-red': 'var(--gradient-red)',
				'gradient-green': 'var(--gradient-green)',
				'gradient-blue': 'var(--gradient-blue)',
				'gradient-brand': 'var(--gradient-brand)',
				'gradient-soft': 'var(--gradient-soft)',
				'gradient-colorful': 'var(--gradient-colorful)',
				'gradient-subtle': 'var(--gradient-subtle)',
				'gradient-mesh': 'var(--gradient-mesh)',
				'gradient-rainbow': 'var(--gradient-rainbow)'
			},
			boxShadow: {
				'elegant': 'var(--shadow-elegant)',
				'colorful': 'var(--shadow-colorful)',
				'glow': 'var(--shadow-glow)',
				'yellow': 'var(--shadow-yellow)',
				'red': 'var(--shadow-red)',
				'green': 'var(--shadow-green)',
				'blue': 'var(--shadow-blue)',
				'soft': 'var(--shadow-soft)',
				'rainbow': 'var(--shadow-rainbow)'
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
					'0%, 100%': { 
						boxShadow: '0 0 15px hsl(var(--primary) / 0.2)' 
					},
					'50%': { 
						boxShadow: '0 0 25px hsl(var(--primary) / 0.3)' 
					}
				},
				'gentle-bounce': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-5px)' }
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
				'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
				'gentle-bounce': 'gentle-bounce 3s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")]
} satisfies Config;
