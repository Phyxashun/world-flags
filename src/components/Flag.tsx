import { Box, Button, Card, Flex, Grid, Heading, Inset, Spinner, Strong, Text } from '@radix-ui/themes';
import React, { useEffect, useRef, useState } from 'react';
import type { FlagData } from '../types/types';
import { countryData } from '../utils/Constants';
import { fetchFlagData, saveBlobToDisk } from '../utils/utils';

const Flag: React.FC = () => {
  const [flags, setFlags] = useState<FlagData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Use a ref to track URLs for cleanup to prevent memory leaks
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const currentUrls = objectUrlsRef.current;

    const loadAllFlags = async () => {
      setIsLoading(true);

      const promises = countryData.map((country) =>
        fetchFlagData(country.code, country.name)
          .then((data) => {
            const url = URL.createObjectURL(data.blob);
            currentUrls.push(url); // Use the local variable
            return { ...data, objectURL: url };
          })
          .catch(() => null)
      );

      const results = await Promise.all(promises);
      const successfulFlags = results.filter((f): f is FlagData => f !== null);

      setFlags(successfulFlags);
      setIsLoading(false);
    };

    loadAllFlags();

    return () => {
      currentUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    for (const flag of flags) {
      await saveBlobToDisk(flag);
      //await new Promise((resolve) => setTimeout(resolve, DOWNLOAD_DELAY));
    }
    setIsSaving(false);
  };

  return (
    <Box p="4">
      <Flex
        justify="between"
        align="center"
        mb="6"
        p="4"
        m="-4"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'var(--color-background)',
          borderBottom: '1px solid var(--gray-5)', // Optional: adds a nice separator when scrolling
        }}
      >
        <Box>
          <Heading size="8" mb="2">
            World Flags
          </Heading>
          <Text color="gray" size="2">
            {isLoading ? 'Fetching flags...' : `Loaded ${flags.length} flags successfully`}
          </Text>
        </Box>

        <Button size="3" variant="soft" onClick={handleSaveAll} disabled={isLoading || isSaving || flags.length === 0}>
          {isSaving ? <Spinner /> : null}
          {isSaving ? 'Saving...' : 'Save All Flags'}
        </Button>
      </Flex>

      {isLoading ? (
        <Flex align="center" justify="center" height="50vh">
          <Spinner size="3" />
        </Flex>
      ) : (
        <Grid columns={{ initial: '2', sm: '3', md: '4', lg: '6' }} gap="4">
          {flags.map((flag) => (
            <Card key={flag.countryCode} size="2" className="flag-card">
              <Inset clip="padding-box" side="top" style={{ overflow: 'hidden' }}>
                <img
                  src={flag.objectURL}
                  alt={`Flag of ${flag.countryName}`}
                  className="flag-img"
                  style={{
                    display: 'block',
                    objectFit: 'cover',
                    width: '100%',
                    height: 120,
                    backgroundColor: 'var(--gray-5)',
                  }}
                />
              </Inset>
              <Text as="p" size="2" align="center" mt="3">
                <Strong>{flag.countryName}</Strong>
              </Text>
            </Card>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Flag;
