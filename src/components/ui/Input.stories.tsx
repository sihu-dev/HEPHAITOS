import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'
import { MagnifyingGlassIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'glass'],
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search'],
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

// 기본 입력
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
  },
}

export const WithHint: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    hint: 'We will never share your email',
  },
}

export const WithError: Story = {
  args: {
    label: 'Password',
    type: 'password',
    error: 'Password must be at least 8 characters',
    placeholder: 'Enter your password',
  },
}

// 아이콘 포함
export const WithLeftIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search strategies...',
    leftIcon: <MagnifyingGlassIcon className="w-4 h-4" />,
  },
}

export const WithRightIcon: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'you@example.com',
    rightIcon: <EnvelopeIcon className="w-4 h-4" />,
  },
}

export const WithBothIcons: Story = {
  args: {
    label: 'Secure Input',
    type: 'password',
    placeholder: 'Enter password',
    leftIcon: <LockClosedIcon className="w-4 h-4" />,
    rightIcon: <span className="text-xs text-zinc-500">?</span>,
  },
}

// 타입 변형
export const Email: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'you@example.com',
  },
}

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
  },
}

export const Number: Story = {
  args: {
    label: 'Investment Amount',
    type: 'number',
    placeholder: '1000',
  },
}

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
    leftIcon: <MagnifyingGlassIcon className="w-4 h-4" />,
  },
}

// 상태
export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit',
    disabled: true,
    value: 'Locked value',
  },
}

export const ReadOnly: Story = {
  args: {
    label: 'Read Only',
    value: 'Cannot change this',
    readOnly: true,
  },
}

// 실전 예시
export const LoginForm: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        leftIcon={<EnvelopeIcon className="w-4 h-4" />}
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        leftIcon={<LockClosedIcon className="w-4 h-4" />}
        hint="At least 8 characters"
      />
    </div>
  ),
}

export const SearchBar: Story = {
  render: () => (
    <div className="w-96">
      <Input
        type="search"
        placeholder="Search strategies, indicators, or patterns..."
        leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
      />
    </div>
  ),
}

export const FormWithValidation: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Input
        label="Strategy Name"
        placeholder="My Trading Strategy"
      />
      <Input
        label="Initial Capital"
        type="number"
        placeholder="10000"
        hint="Minimum $1,000"
      />
      <Input
        label="Risk per Trade (%)"
        type="number"
        placeholder="2"
        error="Must be between 1-5%"
      />
    </div>
  ),
}
