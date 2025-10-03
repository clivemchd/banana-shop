import type { Image } from 'wasp/entities';

export interface GetUserImagesArgs {
  limit?: number;
  offset?: number;
  search?: string;
}

export const getUserImages = async (
  args: GetUserImagesArgs = {},
  context: any
) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { limit = 20, offset = 0, search } = args;

  try {
    const whereClause: any = {
      userId: context.user.id,
    };

    // Add search functionality
    if (search) {
      whereClause.OR = [
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          fileName: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const images = await context.entities.Image.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        editHistory: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Only get the latest edit for the list view
        },
      },
    });

    // Get total count for pagination
    const totalCount = await context.entities.Image.count({
      where: whereClause,
    });

    return {
      images: images.map((image: Image) => ({
        id: image.id,
        url: image.url,
        description: image.description,
        fileName: image.fileName,
        mimeType: image.mimeType,
        isPublic: image.isPublic,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
        latestEdit: (image as any).editHistory?.[0] || null,
      })),
      totalCount,
      hasMore: offset + images.length < totalCount,
    };
  } catch (error) {
    console.error('Error getting user images:', error);
    throw new Error('Failed to retrieve user images');
  }
};

export const getImageWithHistory = async (
  args: { imageId: string },
  context: any
) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { imageId } = args;

  try {
    const image = await context.entities.Image.findUnique({
      where: { id: imageId },
      include: {
        editHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!image) {
      throw new Error('Image not found');
    }

    if (image.userId !== context.user.id) {
      throw new Error('Unauthorized access to image');
    }

    return {
      id: image.id,
      url: image.url,
      description: image.description,
      fileName: image.fileName,
      mimeType: image.mimeType,
      isPublic: image.isPublic,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
      editHistory: ((image as any).editHistory || []).map((edit: any) => ({
        id: edit.id,
        editType: edit.editType,
        prompt: edit.prompt,
        beforeUrl: edit.beforeUrl,
        afterUrl: edit.afterUrl,
        createdAt: edit.createdAt,
      })),
    };
  } catch (error) {
    console.error('Error getting image with history:', error);
    throw new Error('Failed to retrieve image with history');
  }
};

export const getImageById = async (
  args: { imageId: string },
  context: any
) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { imageId } = args;

  try {
    const image = await context.entities.Image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new Error('Image not found');
    }

    if (image.userId !== context.user.id) {
      throw new Error('Unauthorized access to image');
    }

    return {
      id: image.id,
      url: image.url,
      description: image.description,
      fileName: image.fileName,
      mimeType: image.mimeType,
      isPublic: image.isPublic,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };
  } catch (error) {
    console.error('Error getting image by ID:', error);
    throw new Error('Failed to retrieve image');
  }
};

export const searchUserImages = async (
  args: { query: string; limit?: number; offset?: number },
  context: any
): Promise<any> => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { query, limit = 20, offset = 0 } = args;

  if (!query || query.trim().length === 0) {
    return {
      images: [],
      totalCount: 0,
      hasMore: false,
    };
  }

  try {
    const whereClause = {
      userId: context.user.id,
      OR: [
        {
          description: {
            contains: query,
            mode: 'insensitive' as const,
          },
        },
        {
          fileName: {
            contains: query,
            mode: 'insensitive' as const,
          },
        },
        {
          editHistory: {
            some: {
              prompt: {
                contains: query,
                mode: 'insensitive' as const,
              },
            },
          },
        },
      ],
    };

    const images = await context.entities.Image.findMany({
      where: whereClause,
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        editHistory: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    const totalCount = await context.entities.Image.count({
      where: whereClause,
    });

    return {
      images: images.map((image: Image) => ({
        id: image.id,
        url: image.url,
        description: image.description,
        fileName: image.fileName,
        mimeType: image.mimeType,
        isPublic: image.isPublic,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
        latestEdit: (image as any).editHistory?.[0] || null,
      })),
      totalCount,
      hasMore: offset + images.length < totalCount,
    };
  } catch (error) {
    console.error('Error searching user images:', error);
    throw new Error('Failed to search images');
  }
};