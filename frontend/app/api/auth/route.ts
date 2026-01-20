import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // 驗證密碼
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json(
        { ok: false, msg: 'Admin password not configured' },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { ok: false, msg: 'Invalid password' },
        { status: 401 }
      );
    }

    // 生成 JWT 令牌
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { authenticated: true },
      secret,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      ok: true,
      token,
      msg: 'Authentication successful',
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, msg: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
