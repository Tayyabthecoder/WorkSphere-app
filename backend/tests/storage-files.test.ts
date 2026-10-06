import fs from 'fs';
import path from 'path';
import { getUploadFilePath, deleteLocalFile } from '../src/services/storage.js';

describe('Storage & Binary File Upload Pipeline', () => {
  const testTenant = 'tenant_123';
  const testProject = 'prj_abc';
  const testFilename = 'sample_document.pdf';

  it('should generate isolated tenant and project upload file path', () => {
    const uploadPath = getUploadFilePath(testTenant, testProject, testFilename);
    expect(uploadPath).toContain(path.join('uploads', testTenant, testProject, testFilename));
  });

  it('should sanitize directory traversal attempts in tenant or project IDs', () => {
    const maliciousTenant = '../../etc/passwd';
    const maliciousProject = '..\\..\\windows\\system32';
    const uploadPath = getUploadFilePath(maliciousTenant, maliciousProject, 'exploit.txt');

    // Should have stripped ../ and ..\ path traversal characters
    expect(uploadPath).not.toContain('..');
    expect(uploadPath).toContain('etcpasswd');
  });

  it('should safely delete existing local file and return true', () => {
    const tmpFilePath = path.join(process.cwd(), 'uploads', `test_file_${Date.now()}.tmp`);
    fs.mkdirSync(path.dirname(tmpFilePath), { recursive: true });
    fs.writeFileSync(tmpFilePath, 'test content', 'utf-8');

    expect(fs.existsSync(tmpFilePath)).toBe(true);
    const deleted = deleteLocalFile(tmpFilePath);
    expect(deleted).toBe(true);
    expect(fs.existsSync(tmpFilePath)).toBe(false);
  });

  it('should return false when deleting non-existent file without throwing', () => {
    const nonExistentPath = path.join(process.cwd(), 'uploads', 'non_existent_file.tmp');
    expect(deleteLocalFile(nonExistentPath)).toBe(false);
  });
});
