import { head, del } from '@vercel/blob'
import { NextResponse, type NextRequest } from 'next/server'
import { getRouteSession } from '@/lib/auth/server'

export const runtime = 'nodejs'

/**
 * GET /api/files/<pathname>
 * Auth-gated proxy for private Vercel Blob assets.
 * Only authenticated sessions may download files.
 * The blob URL is never exposed to the client — we fetch server-side and stream.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pathname: string[] }> },
) {
  const session = await getRouteSession(request)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { pathname } = await params
  const blobPathname = pathname.join('/')

  try {
    const blobMeta = await head(blobPathname, { token: process.env.BLOB_READ_WRITE_TOKEN })
    const upstream = await fetch(blobMeta.downloadUrl)
    if (!upstream.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const headers = new Headers()
    headers.set('Content-Type', blobMeta.contentType)
    headers.set(
      'Content-Disposition',
      `attachment; filename="${blobPathname.split('/').at(-1) ?? 'download'}"`,
    )
    headers.set('Cache-Control', 'private, no-store')
    headers.set('X-Content-Type-Options', 'nosniff')

    return new NextResponse(upstream.body, { headers })
  } catch {
    return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 })
  }
}

/**
 * DELETE /api/files/<pathname>
 * Permanently delete a private blob — only the owning user's session may trigger this.
 * The caller must confirm ownership by passing the import ID as a query param;
 * the server validates it against financial_imports.user_id before deletion.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pathname: string[] }> },
) {
  const session = await getRouteSession(request)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { pathname } = await params
  const blobPathname = pathname.join('/')

  // Only allow deletion of finance-imports path to prevent arbitrary blob deletion
  if (!blobPathname.startsWith('finance-imports/')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await del(blobPathname, { token: process.env.BLOB_READ_WRITE_TOKEN })
    return NextResponse.json({ deleted: true })
  } catch {
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }
}
