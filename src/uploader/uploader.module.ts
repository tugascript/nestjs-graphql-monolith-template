import { Module } from '@nestjs/common';
import { UploaderService } from './uploader.service';

@Module({
  // imports: [CommonModule], // uncoment on tests
  providers: [UploaderService],
  exports: [UploaderService],
})
export class UploaderModule {}
