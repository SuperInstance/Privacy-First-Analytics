# Contributing to Privacy-First Analytics

Thank you for your interest in contributing to Privacy-First Analytics! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [project maintainers].

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Use the issue template
3. Include:
   - Clear title and description
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment (OS, browser, Node.js version)
   - Code samples demonstrating the issue

### Suggesting Enhancements

1. Check existing feature requests
2. Use the feature request template
3. Explain the use case
4. Provide examples of how the feature would work
5. Consider if it fits the project's privacy-first philosophy

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Update documentation if needed
7. Commit your changes (`git commit -m 'Add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Privacy-First-Analytics.git
cd Privacy-First-Analytics

# Install dependencies
npm install

# Run build
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide type annotations for all functions
- Avoid `any` types
- Use interfaces for object shapes
- Use type aliases for union types
- Document complex types with JSDoc comments

Example:
```typescript
/**
 * Track an analytics event
 * @param type - Event type
 * @param data - Event data
 */
async track(type: EventType, data: EventData): Promise<void> {
  // Implementation
}
```

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Use trailing commas in multi-line objects/arrays
- Maximum line length: 100 characters

### Naming Conventions

- **Classes:** PascalCase (e.g., `EventCollector`)
- **Functions/Methods:** camelCase (e.g., `trackEvent`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `DEFAULT_CONFIG`)
- **Interfaces:** PascalCase with `I` prefix (e.g., `IEventStore`)
- **Types:** PascalCase (e.g., `EventType`, `TimeRange`)

### Comments

- Use JSDoc comments for all public APIs
- Comment complex algorithms
- Explain non-obvious logic
- Keep comments concise and clear

Example:
```typescript
/**
 * Calculate percentiles from sorted values
 * @param sortedValues - Sorted array of numeric values
 * @returns Object with p50, p90, p95, p99 percentiles
 */
function calculatePercentiles(sortedValues: number[]): Percentiles {
  // Implementation
}
```

## Testing Guidelines

### Unit Tests

- Test all public methods
- Test edge cases and error conditions
- Mock external dependencies
- Use descriptive test names

Example:
```typescript
describe('EventCollector', () => {
  describe('track()', () => {
    it('should track an event successfully', async () => {
      // Arrange
      const collector = new EventCollector(mockStore)
      await collector.initialize()

      // Act
      await collector.track('feature_used', { featureId: 'test' })

      // Assert
      const events = await mockStore.queryEvents()
      expect(events).toHaveLength(1)
    })

    it('should respect sampling rate', async () => {
      // Test implementation
    })
  })
})
```

### Test Coverage

- Aim for 80%+ code coverage
- Cover critical paths thoroughly
- Test error conditions
- Include edge cases

### Integration Tests

- Test component interactions
- Use real storage backends
- Test with realistic data volumes
- Verify end-to-end workflows

## Documentation Standards

### Code Documentation

- Document all public APIs
- Include usage examples
- Explain parameters and return values
- Note any edge cases or limitations

### README Updates

When adding features:
1. Update feature list
2. Add usage example
3. Update configuration section if applicable
4. Add to API reference

### API Documentation

When adding/changing APIs:
1. Update docs/API.md
2. Document all parameters
3. Provide usage examples
4. Note breaking changes

## Pull Request Guidelines

### PR Title

Use clear, descriptive titles:
- Good: "Add localStorage backend support"
- Bad: "Update files"

### PR Description

Include:
- Summary of changes
- Motivation for the change
- Related issues
- Breaking changes (if any)
- Screenshots (if applicable)
- Testing instructions

### Review Process

1. Automated checks must pass
2. At least one maintainer approval required
3. Address all review feedback
4. Keep PRs focused and small
5. Update commit history if needed

### Merge Policy

- Maintainable code
- Adequate tests
- Documentation updated
- No breaking changes without major version bump
- All tests passing

## Project Structure

```
packages/privacy-first-analytics/
├── src/              # Source code
│   ├── *.ts         # Main implementation files
│   └── index.ts     # Main export
├── tests/           # Test files
│   └── *.test.ts   # Unit and integration tests
├── examples/        # Usage examples
│   └── *.ts        # Example code
├── docs/           # Documentation
│   ├── API.md      # API reference
│   └── ARCHITECTURE.md  # Architecture docs
└── README.md       # Main README
```

## Feature Guidelines

### Privacy-First Philosophy

All contributions must align with our privacy-first principles:

1. **No Data Transmission:** Never add code that sends data externally
2. **User Control:** Always give users control over their data
3. **Transparency:** Make data collection visible and clear
4. **Minimization:** Collect only necessary data
5. **Local-Only:** Keep all data on the user's device

### Performance Requirements

- Event tracking: <1ms overhead
- Non-blocking operations
- Efficient memory usage
- Batched writes to storage

### Compatibility

- Support modern browsers
- Support Node.js (with appropriate polyfills)
- Maintain backward compatibility
- Document breaking changes

## Release Process

### Versioning

Follow Semantic Versioning:
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes (backward compatible)

### Release Checklist

1. Update version in package.json
2. Update CHANGELOG.md
3. Ensure all tests pass
4. Update documentation
5. Create git tag
6. Create GitHub release
7. Publish to npm

### Changelog Format

```markdown
## [1.1.0] - 2026-01-15

### Added
- New localStorage backend
- Custom event type support

### Changed
- Improved query performance
- Updated documentation

### Fixed
- Fixed batch flush timing issue
- Fixed session timeout calculation

### Deprecated
- Old event format (will be removed in 2.0.0)
```

## Getting Help

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Questions and ideas
- Documentation: README and docs/
- Code Comments: Inline documentation

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in significant feature announcements

Thank you for contributing to Privacy-First Analytics! 🎉

---

For questions, please open an issue or start a discussion.
