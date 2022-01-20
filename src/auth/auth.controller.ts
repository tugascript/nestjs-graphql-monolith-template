import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/refresh-access')
  public async refreshAccessToken(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const accessToken = await this.authService.refreshAccessToken(req, res);
    res.status(200).json({
      accessToken,
    });
  }
}
