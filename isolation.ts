/**
 * Isolation Sandbox Strategy
 *
 * Enforces full-stack isolation rules:
 * - Backend: Hexagonal Architecture (Ports and Adapters)
 * - Frontend: Shadow Components (Component.v2.tsx) + CSS Modules
 * - Database: Schema Evolution (add-only migrations)
 */

export interface Violation {
  type: 'IN_PLACE_EDITING' | 'CSS_POLLUTION' | 'SCHEMA_MODIFICATION';
  file: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Isolation Sandbox Validator
 */
export class IsolationSandbox {
  /**
   * Validate a file path against isolation rules
   */
  validateFilePath(filePath: string, content: string): Violation[] {
    const violations: Violation[] = [];

    // Backend isolation check
    if (filePath.match(/src\/(?!features\/).*\.(ts|js)$/)) {
      violations.push({
        type: 'IN_PLACE_EDITING',
        file: filePath,
        description: 'Backend code must be in src/features/ directory',
        severity: 'HIGH',
      });
    }

    // Frontend isolation check
    if (filePath.match(/components\/.*\.(tsx|jsx)$/) && !filePath.includes('.v2.')) {
      violations.push({
        type: 'IN_PLACE_EDITING',
        file: filePath,
        description: 'Components must use shadow pattern (Component.v2.tsx)',
        severity: 'HIGH',
      });
    }

    // CSS pollution check
    if (filePath.match(/\.global\.(css|scss|less)$/)) {
      violations.push({
        type: 'CSS_POLLUTION',
        file: filePath,
        description: 'Global CSS causes style pollution. Use CSS Modules instead.',
        severity: 'MEDIUM',
      });
    }

    // Schema modification check
    if (filePath.match(/migrations\/.*\.sql$/)) {
      const sqlViolations = this.validateMigrationSQL(content);
      violations.push(...sqlViolations.map(v => ({ ...v, file: filePath })));
    }

    return violations;
  }

  /**
   * Validate SQL migration for add-only rule
   */
  private validateMigrationSQL(sql: string): Omit<Violation, 'file'>[] {
    const violations: Omit<Violation, 'file'>[] = [];

    // Check for ALTER TABLE ... MODIFY/CHANGE/DROP
    const modifyPattern =
      /ALTER\s+TABLE\s+\w+\s+(MODIFY|CHANGE|DROP)\s+/gi;
    if (modifyPattern.test(sql)) {
      violations.push({
        type: 'SCHEMA_MODIFICATION',
        description:
          'Migrations must be add-only. Use ALTER TABLE ... ADD COLUMN instead.',
        severity: 'HIGH',
      });
    }

    // Check for DROP TABLE
    if (/DROP\s+TABLE\s+/gi.test(sql)) {
      violations.push({
        type: 'SCHEMA_MODIFICATION',
        description: 'Migrations cannot drop tables. Deprecate instead.',
        severity: 'HIGH',
      });
    }

    return violations;
  }

  /**
   * Generate recommended file path for new feature
   */
  generatePath(
    featureName: string,
    layer: 'domain' | 'ports' | 'adapters' | 'components',
    fileName: string
  ): string {
    const normalizedFeature = featureName.toLowerCase().replace(/\s+/g, '-');

    if (layer === 'components') {
      return `components/${fileName}.v2.tsx`;
    }

    if (layer === 'domain') {
      return `src/features/${normalizedFeature}/domain/${fileName}`;
    }

    if (layer === 'ports') {
      return `src/features/${normalizedFeature}/ports/${fileName}`;
    }

    if (layer === 'adapters') {
      return `src/features/${normalizedFeature}/adapters/${fileName}`;
    }

    throw new Error(`Unknown layer: ${layer}`);
  }

  /**
   * Get directory structure template for a new feature
   */
  generateFeatureStructure(featureName: string): {
    path: string;
    description: string;
  }[] {
    const normalized = featureName.toLowerCase().replace(/\s+/g, '-');
    const basePath = `src/features/${normalized}`;

    return [
      { path: basePath, description: 'Feature root directory' },
      {
        path: `${basePath}/domain`,
        description: 'Business logic, entities, value objects, use cases',
      },
      {
        path: `${basePath}/domain/entities`,
        description: 'Domain entities',
      },
      {
        path: `${basePath}/domain/value-objects`,
        description: 'Value objects',
      },
      {
        path: `${basePath}/domain/use-cases`,
        description: 'Use cases (application logic)',
      },
      {
        path: `${basePath}/ports`,
        description: 'Port interfaces',
      },
      {
        path: `${basePath}/ports/primary`,
        description: 'Primary ports (controllers, UI adapters)',
      },
      {
        path: `${basePath}/ports/secondary`,
        description: 'Secondary ports (repository interfaces)',
      },
      {
        path: `${basePath}/adapters`,
        description: 'Adapter implementations',
      },
      {
        path: `${basePath}/adapters/primary`,
        description: 'Primary adapters (HTTP controllers, etc.)',
      },
      {
        path: `${basePath}/adapters/secondary`,
        description: 'Secondary adapters (DB repositories, external APIs)',
      },
    ];
  }
}

/**
 * Shadow Component Generator
 */
export class ShadowComponentGenerator {
  /**
   * Generate shadow component template
   */
  generateShadowComponent(
    componentName: string,
    existingComponentPath?: string
  ): string {
    return `// ${componentName}.v2.tsx
// Shadow component - isolated from original implementation
${existingComponentPath ? `// Original: ${existingComponentPath}` : ''}

import styles from './${componentName}.module.css';

interface ${componentName}Props {
  // Define props here
}

export function ${componentName}V2({ ...props }: ${componentName}Props) {
  return (
    <div className={styles.container}>
      {/* Component implementation */}
    </div>
  );
}

// TODO: Replace original component after validation
`;
  }

  /**
   * Generate CSS Module template
   */
  generateCSSModule(componentName: string): string {
    return `/* ${componentName}.module.css - Scoped styles */
/* No global style pollution */

.container {
  /* Styles */
}

/* All selectors are scoped by CSS Modules */
`;
  }
}

/**
 * Schema Evolution Generator
 */
export class SchemaEvolutionGenerator {
  /**
   * Generate add-only migration template
   */
  generateAddMigration(
    tableName: string,
    columns: Array<{ name: string; type: string; nullable?: boolean }>
  ): string {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const timestamp = date.replace(/-/g, '');

    let sql = `-- Migration: Add columns to ${tableName}
-- Date: ${date}
-- Type: ADD (Schema Evolution - Add Only)

`;

    for (const col of columns) {
      sql += `\nALTER TABLE \`${tableName}\`\n`;
      sql += `  ADD COLUMN \`${col.name}\` ${col.type}${col.nullable ? '' : ' NOT NULL'}`;
      sql += ',\n';
    }

    // Remove trailing comma
    sql = sql.slice(0, -2) + ';\n';

    return sql;
  }

  /**
   * Generate new table migration template
   */
  generateNewTableMigration(
    tableName: string,
    columns: Array<{
      name: string;
      type: string;
      constraints?: string[];
    }>
  ): string {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');

    let sql = `-- Migration: Create table ${tableName}
-- Date: ${date}
-- Type: CREATE (Schema Evolution - New Table)

CREATE TABLE \`${tableName}\` (
  \`id\` BIGINT PRIMARY KEY AUTO_INCREMENT,
  \`created_at\` TIMESTAMP DEFAULT NOW(),
  \`updated_at\` TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
`;

    for (const col of columns) {
      sql += `  \`${col.name}\` ${col.type}${col.constraints?.length ? ' ' + col.constraints.join(' ') : ''},\n`;
    }

    sql += `  INDEX (\`id\`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n`;

    return sql;
  }
}

/**
 * Validation Report Generator
 */
export class ValidationReportGenerator {
  generateReport(
    files: string[],
    violations: Violation[]
  ): string {
    let report = '# Isolation Sandbox Validation Report\n\n';
    report += `## Summary\n\n`;
    report += `- Files scanned: ${files.length}\n`;
    report += `- Violations found: ${violations.length}\n\n`;

    const bySeverity = {
      HIGH: violations.filter(v => v.severity === 'HIGH'),
      MEDIUM: violations.filter(v => v.severity === 'MEDIUM'),
      LOW: violations.filter(v => v.severity === 'LOW'),
    };

    report += `## By Severity\n\n`;
    report += `- HIGH: ${bySeverity.HIGH.length}\n`;
    report += `- MEDIUM: ${bySeverity.MEDIUM.length}\n`;
    report += `- LOW: ${bySeverity.LOW.length}\n\n`;

    if (violations.length > 0) {
      report += `## Violations\n\n`;

      for (const v of violations) {
        report += `### ${v.type} (${v.severity})\n`;
        report += `- **File:** \`${v.file}\`\n`;
        report += `- **Description:** ${v.description}\n\n`;
      }
    }

    report += `## Status\n\n`;
    report += violations.length === 0
      ? '✅ All checks passed'
      : '❌ Violations detected - fix before proceeding';

    return report;
  }
}
