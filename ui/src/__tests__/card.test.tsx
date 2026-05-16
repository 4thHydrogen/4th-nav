import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Card from '../components/CardV2';

describe('CardV2 component', () => {
  const defaultProps = {
    title: '测试工具',
    url: 'https://example.com',
    des: '这是一个测试工具',
    logo: 'test.ico',
    catelog: '开发工具',
    index: 0,
    isSearching: false,
    noImageMode: false,
    compactMode: false,
    onClick: vi.fn(),
  };

  it('renders title', () => {
    render(<Card {...defaultProps} />);
    expect(screen.getByText('测试工具')).toBeInTheDocument();
  });

  it('renders category tag', () => {
    render(<Card {...defaultProps} />);
    expect(screen.getByText('开发工具')).toBeInTheDocument();
  });

  it('renders description in non-compact mode', () => {
    render(<Card {...defaultProps} />);
    expect(screen.getByText('这是一个测试工具')).toBeInTheDocument();
  });

  it('hides description in compact mode', () => {
    render(<Card {...defaultProps} compactMode={true} />);
    expect(screen.queryByText('这是一个测试工具')).not.toBeInTheDocument();
  });

  it('shows category as "未分类" when catelog is empty', () => {
    render(<Card {...defaultProps} catelog="" />);
    expect(screen.getByText('未分类')).toBeInTheDocument();
  });

  it('shows index number when searching and index < 10', () => {
    render(<Card {...defaultProps} isSearching={true} index={2} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not show index when not searching', () => {
    render(<Card {...defaultProps} isSearching={false} index={0} />);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Card {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByText('测试工具'));
    expect(onClick).toHaveBeenCalled();
  });

  it('hides image in noImageMode', () => {
    const { container } = render(<Card {...defaultProps} noImageMode={true} />);
    expect(container.querySelector('.card-left')).toBeNull();
  });
});
